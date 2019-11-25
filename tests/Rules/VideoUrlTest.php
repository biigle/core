<?php

namespace Biigle\Modules\Videos\Tests\Rules;

use Storage;
use TestCase;
use GuzzleHttp\Client;
use Illuminate\Http\File;
use GuzzleHttp\Middleware;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Handler\MockHandler;
use Biigle\Modules\Videos\Rules\VideoUrl;
use GuzzleHttp\Exception\RequestException;

class VideoUrlTest extends TestCase
{
    public function testNoDisk()
    {
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'test'));
        $this->assertStringContainsString('Unable to identify storage disk', $validator->message());
    }

    public function testUnknownDisk()
    {
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'abc://dir'));
        $this->assertStringContainsString("Storage disk 'abc' does not exist", $validator->message());
    }

    public function testDiskNotThere()
    {
        Storage::fake('test');
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'test://dir'));
        $this->assertStringContainsString("Unable to access 'dir'", $validator->message());
    }

    public function testDiskMime()
    {
        Storage::fake('test');
        Storage::disk('test')->put('file.txt', 'abc');
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'test://file.txt'));
        $this->assertStringContainsString("Videos of type 'text/plain' are not supported", $validator->message());
    }

    public function testDiskOk()
    {
        Storage::fake('test');
        $file = new File(__DIR__.'/../files/test.mp4');
        Storage::disk('test')->putFileAs('', $file, 'video.mp4');
        $validator = new VideoUrl;
        $this->assertTrue($validator->passes(null, 'test://video.mp4'));
    }

    public function testRemoteError()
    {
        $mock = new MockHandler([new RequestException('Error Communicating with Server', new Request('HEAD', 'test'))]);

        $handler = HandlerStack::create($mock);

        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote video URL does not seem to exist', $validator->message());
    }

    public function testRemoteNotReadable()
    {
        $mock = new MockHandler([new Response(500)]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote video URL returned an error response', $validator->message());
    }

    public function testRemoteClientError()
    {
        $mock = new MockHandler([new Response(400)]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });
        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString('The remote video URL returned an error response', $validator->message());
    }

    public function testRemoteMimeNotSupported()
    {
        $response = new Response(200, ['Content-Type' => ['text/plain; charset=utf-8']]);
        $mock = new MockHandler([$response]);

        $container = [];
        $history = Middleware::history($container);

        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });

        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString("Videos of type 'text/plain' are not supported", $validator->message());
    }

    public function testRemoteOk()
    {
        $response = new Response(200, ['Content-Type' => ['video/mp4']]);
        $mock = new MockHandler([$response]);

        $container = [];
        $history = Middleware::history($container);

        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });

        $validator = new VideoUrl;
        $this->assertTrue($validator->passes(null, 'http://localhost'));

        $request = $container[0]['request'];
        $this->assertEquals('HEAD', $request->getMethod());
        $this->assertEquals('http://localhost', (string) $request->getUri());
    }

    public function testRemoteOfflineMode()
    {
        config(['biigle.offline_mode' => true]);

        $validator = new VideoUrl;
        $this->assertFalse($validator->passes(null, 'http://localhost'));
        $this->assertStringContainsString("disk 'http' does not exist", $validator->message());
    }
}
