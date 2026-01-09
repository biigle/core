<?php

namespace Biigle\Tests\Rules;

use Biigle\Role;
use Biigle\Rules\VolumeUrl;
use Biigle\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Storage;
use TestCase;

class VolumeUrlTest extends TestCase
{
    public $traversalAttempts = [
        '../somefile.png',
        '../../somefile.png',
        '..//somefile.png',
        '..//../somefile.png',
        '..//..//somefile.png',
        'somedir/../somefile.png',
        'somedir/somefile.png/..',
        'somedir/somefile.png/../someotherfile.png',
        'somedir/somefile.png/../../someotherfile.png',
        'somedir/somefile.png//..//someotherfile.png',

        //URL encoded traversals, null bytes etc.
        '%2e%2e%2fsomefile.png',
        '%2e%2e%2f%2e%2e%2fsomefile.png',
        '..%2f..%2f..%5csomefile.png',
        '%2e%2e%2f%2e%2e%2fsomefile%00.png',
    ];
    public $validPathAttempts = [
        'somefile.png',
        'somefile..png',
        'somefile..someothername/name.png',
    ];

    public function setUp(): void
    {
        parent::setUp();
        config(['volumes.editor_storage_disks' => ['test']]);
        $this->user = User::factory()->make(['role_id' => Role::editorId()]);
        $this->be($this->user);
    }

    public function testNoDisk()
    {
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'test'));
        $this->assertStringContainsString('Unable to identify storage disk', $validator->message());
    }

    public function testUnknownDisk()
    {
        config(['volumes.editor_storage_disks' => ['abc']]);
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'abc://dir'));
        $this->assertStringContainsString("Disk [abc] does not have a configured driver", $validator->message());
    }

    public function testNotThere()
    {
        Storage::fake('test');
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'test://dir'));
        $this->assertStringContainsString("Unable to access 'dir'", $validator->message());
    }

    public function testOkFile()
    {
        $disk = Storage::fake('test');
        $disk->put('dir/file.txt', 'abc');
        $validator = new VolumeUrl;
        $this->assertTrue($validator->passes(null, 'test://dir'));
    }

    public function testOkDirectory()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('dir/dir2');
        $validator = new VolumeUrl;
        $this->assertTrue($validator->passes(null, 'test://dir'));
    }

    public function testAuthorizeDiskAdmin()
    {
        config(['volumes.admin_storage_disks' => ['admin-test']]);

        $disk = Storage::fake('admin-test');
        $disk->put('dir/file.txt', 'abc');

        $disk = Storage::fake('test');
        $disk->put('dir/elif.txt', 'abc');

        $this->user->role_id = Role::adminId();

        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'test://dir'));
        $this->assertStringContainsString('Not authorized to access this storage disk', $validator->message());
        $this->assertTrue($validator->passes(null, 'admin-test://dir'));
    }

    public function testAuthorizeDiskEditor()
    {
        config(['volumes.admin_storage_disks' => ['admin-test']]);

        $disk = Storage::fake('admin-test');
        $disk->put('dir/file.txt', 'abc');

        $disk = Storage::fake('test');
        $disk->put('dir/elif.txt', 'abc');

        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'admin-test://dir'));
        $this->assertStringContainsString('Not authorized to access this storage disk', $validator->message());
        $this->assertTrue($validator->passes(null, 'test://dir'));
    }

    public function testDiskTraversals()
    {
        $disk = Storage::fake('test');
        $disk->put('dir/elif.txt', 'abc');

        $validator = new VolumeUrl;

        foreach ($this->traversalAttempts as $attempt) {
            $this->assertFalse($validator->passes(null, 'test://dir/'.$attempt));
            $this->assertStringContainsString('Volume URLs with path traversal instructions are not allowed.', $validator->message());
        }
        foreach ($this->validPathAttempts as $attempt) {
            $this->assertFalse($validator::pathHasDirectoryTraversal(null, 'test://dir/'.$attempt));
        }
    }

    public function testRemoteError()
    {
        $mock = new MockHandler([new RequestException('Error Communicating with Server', new Request('HEAD', 'test'))]);

        $handler = HandlerStack::create($mock);

        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, fn () => $client);
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote volume URL does not seem to exist', $validator->message());
    }

    public function testRemoteNotReadable()
    {
        $mock = new MockHandler([new Response(500)]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, fn () => $client);
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote volume URL returned an error response', $validator->message());
    }

    public function testRemoteOk()
    {
        $mock = new MockHandler([
            new Response(404),
            new Response(200),
        ]);

        $container = [];
        $history = Middleware::history($container);

        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, fn () => $client);

        $validator = new VolumeUrl;
        $this->assertTrue($validator->passes(null, 'http://localhost'));

        $request = $container[0]['request'];
        $this->assertSame('HEAD', $request->getMethod());
        $this->assertSame('http://localhost', (string) $request->getUri());
    }

    public function testRemoteOfflineMode()
    {
        config(['volumes.editor_storage_disks' => ['http']]);
        config(['biigle.offline_mode' => true]);

        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString("Disk [http] does not have a configured driver", $validator->message());
    }

    public function testRemoteProviderBlacklist()
    {
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://dropbox.com'));
        $this->assertStringContainsString('are not supported as remote locations', $validator->message());
        $this->assertFalse($validator->passes(null, 'https://dropbox.com'));
        $this->assertFalse($validator->passes(null, 'http://www.dropbox.com'));
        $this->assertFalse($validator->passes(null, 'https://www.dropbox.com'));
        $this->assertFalse($validator->passes(null, 'http://onedrive.com'));
        $this->assertFalse($validator->passes(null, 'https://onedrive.com'));
        $this->assertFalse($validator->passes(null, 'http://drive.google.com'));
        $this->assertFalse($validator->passes(null, 'https://drive.google.com'));
    }

    public function testRemoteProviderTraversals()
    {
        $mock = new MockHandler([
            new Response(404),
            new Response(200),
        ]);

        $container = [];
        $history = Middleware::history($container);

        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, fn () => $client);

        $validator = new VolumeUrl;
        foreach ($this->traversalAttempts as $attempt) {
            $this->assertFalse($validator->passes(null, 'http://localhost/'.$attempt));
            $this->assertStringContainsString('Volume URLs with path traversal instructions are not allowed.', $validator->message());
        }
        foreach ($this->validPathAttempts as $attempt) {
            $this->assertFalse($validator::pathHasDirectoryTraversal(null, 'http://localhost/'.$attempt));
        }
    }
}
