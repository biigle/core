<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\FederatedSearchInstance;
use Biigle\Jobs\UpdateFederatedSearchIndex;
use Biigle\Tests\FederatedSearchInstanceTest;
use Biigle\Tests\FederatedSearchModelTest;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Bus;

class FederatedSearchInstanceControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/federated-search-instances');

        $this->beAdmin();
        $this->postJson('/api/v1/federated-search-instances')->assertStatus(403);

        $this->beGlobalAdmin();
        $this
            ->postJson('/api/v1/federated-search-instances', [
                'name' => 'my instance',
            ])
            // url missing
            ->assertStatus(422);

        $this
            ->postJson('/api/v1/federated-search-instances', [
                'url' => 'https://example.com',
            ])
            // name missing
            ->assertStatus(422);

        $this
            ->postJson('/api/v1/federated-search-instances', [
                'name' => 'my instance',
                'url' => 'https://example.com',
            ])
            ->assertStatus(201);

        $instance = FederatedSearchInstance::first();
        $this->assertNotNull($instance);
        $this->assertEquals('my instance', $instance->name);
        $this->assertEquals('https://example.com', $instance->url);
        $this->assertNull($instance->local_token);
        $this->assertNull($instance->remote_token);
        $this->assertNull($instance->indexed_at);

        $this
            ->postJson('/api/v1/federated-search-instances', [
                'name' => 'my other instance',
                'url' => 'https://example.com',
            ])
            // url must be unique
            ->assertStatus(422);
    }

    public function testUpdate()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
        ]);
        $id = $instance->id;

        $this->doTestApiRoute('PUT', "/api/v1/federated-search-instances/{$id}");

        $this->beAdmin();
        $this->putJson("/api/v1/federated-search-instances/{$id}")->assertStatus(403);

        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'name' => 'my updated instance',
                'url' => 'https://www.example.com',
            ])
            ->assertStatus(200);

        $instance->refresh();
        $this->assertEquals('my updated instance', $instance->name);
        $this->assertEquals('https://www.example.com', $instance->url);
    }

    public function testUpdateSetRemoteToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
        ]);
        $id = $instance->id;

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler([new Response(200)]);
            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        Bus::fake();
        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'remote_token' => 'mytoken',
            ])
            ->assertStatus(200);

        $this->assertEquals('mytoken', $instance->fresh()->remote_token);
        $this->assertCount(1, $container);
        $request = $container[0]['request'];
        $this->assertEquals('https://example.com/api/v1/federated-search-index', strval($request->getUri()));
        $this->assertEquals('Bearer mytoken', $request->getHeaderLine('Authorization'));
        $this->assertEquals('HEAD', $request->getMethod());
        Bus::assertDispatched(UpdateFederatedSearchIndex::class);
    }

    public function testUpdateSetRemoteTokenInvalidToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
        ]);
        $id = $instance->id;

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler([new Response(401)]);
            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        Bus::fake();
        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'remote_token' => 'mytoken',
            ])
            ->assertStatus(422);
        Bus::assertNotDispatched(UpdateFederatedSearchIndex::class);
    }

    public function testUpdateSetRemoteTokenInvalidUrl()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
        ]);
        $id = $instance->id;

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler([
                new Response(404),
                new RequestException('Error', new Request('HEAD', 'content'))
            ]);
            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        Bus::fake();
        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'remote_token' => 'mytoken',
            ])
            ->assertStatus(422);

        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'remote_token' => 'mytoken',
            ])
            ->assertStatus(422);
        Bus::assertNotDispatched(UpdateFederatedSearchIndex::class);
    }

    public function testUpdateClearRemoteToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
            'remote_token' => 'xyz',
        ]);
        $id = $instance->id;
        FederatedSearchModelTest::create(['federated_search_instance_id' => $id]);

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler();
            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        Bus::fake();
        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'remote_token' => '',
            ])
            ->assertStatus(200);

        $this->assertCount(0, $container);
        $this->assertNull($instance->fresh()->remote_token);
        Bus::assertNotDispatched(UpdateFederatedSearchIndex::class);
        $this->assertFalse($instance->models()->exists());
    }

    public function testUpdateUrlWithRemoteToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'name' => 'my instance',
            'url' => 'https://example.com',
            'remote_token' => 'mytoken',
        ]);
        $id = $instance->id;

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler([new Response(200)]);
            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        Bus::fake();
        $this->beGlobalAdmin();
        $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'url' => 'https://www.example.com',
            ])
            ->assertStatus(200);

        Bus::assertNotDispatched(UpdateFederatedSearchIndex::class);
        $this->assertCount(1, $container);
        $request = $container[0]['request'];
        $this->assertEquals('https://www.example.com/api/v1/federated-search-index', strval($request->getUri()));
        $this->assertEquals('Bearer mytoken', $request->getHeaderLine('Authorization'));
        $this->assertEquals('HEAD', $request->getMethod());
    }

    public function testUpdateGetLocalToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'local_token' => null,
        ]);
        $id = $instance->id;

        $this->beGlobalAdmin();
        $response = $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'local_token' => true,
            ])
            ->assertStatus(200);

        $this->assertNotNull($instance->fresh()->local_token);
        $this->assertStringContainsString('new_local_token', $response->getContent());

        $this
            ->put("/api/v1/federated-search-instances/{$id}", [
                'local_token' => true,
            ])
            ->assertSessionHas('new_local_token');
    }

    public function testUpdateClearLocalToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'local_token' => 'abc',
        ]);
        $id = $instance->id;

        $this->beGlobalAdmin();
        $response = $this
            ->putJson("/api/v1/federated-search-instances/{$id}", [
                'local_token' => false,
            ])
            ->assertStatus(200);

        $this->assertNull($instance->fresh()->local_token);
    }

    public function testDestroy()
    {
        $id = FederatedSearchInstanceTest::create()->id;

        $this->doTestApiRoute('DELETE', "/api/v1/federated-search-instances/{$id}");

        $this->beAdmin();
        $this->deleteJson("/api/v1/federated-search-instances/{$id}")->assertStatus(403);

        $this->beGlobalAdmin();
        $this->deleteJson("/api/v1/federated-search-instances/{$id}")->assertStatus(200);
        $this->assertNull(FederatedSearchInstance::find($id));
        $this->deleteJson("/api/v1/federated-search-instances/{$id}")->assertStatus(404);
    }
}
