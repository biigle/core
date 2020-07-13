<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VolumeUrl;
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
    public function testNoDisk()
    {
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'test'));
        $this->assertStringContainsString('Unable to identify storage disk', $validator->message());
    }

    public function testUnknownDisk()
    {
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'abc://dir'));
        $this->assertStringContainsString("Storage disk 'abc' does not exist", $validator->message());
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
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('dir');
        Storage::disk('test')->put('dir/file.txt', 'abc');
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

    public function testRemoteError()
    {
        $mock = new MockHandler([new RequestException('Error Communicating with Server', new Request('HEAD', 'test'))]);

        $handler = HandlerStack::create($mock);

        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });
        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote volume URL does not seem to exist', $validator->message());
    }

    public function testRemoteNotReadable()
    {
        $mock = new MockHandler([new Response(500)]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });
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
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });

        $validator = new VolumeUrl;
        $this->assertTrue($validator->passes(null, 'http://localhost'));

        $request = $container[0]['request'];
        $this->assertEquals('HEAD', $request->getMethod());
        $this->assertEquals('http://localhost', (string) $request->getUri());
    }

    public function testRemoteOfflineMode()
    {
        config(['biigle.offline_mode' => true]);

        $validator = new VolumeUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString("disk 'http' does not exist", $validator->message());
    }
}
