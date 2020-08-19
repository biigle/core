<?php

namespace Biigle\Tests\Jobs;

use Biigle\FederatedSearchModel;
use Biigle\Jobs\UpdateFederatedSearchIndex;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Tests\FederatedSearchInstanceTest;
use Biigle\Tests\UserTest;
use Biigle\Volume;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use TestCase;

class UpdateFederatedSearchIndexTest extends TestCase
{
    public function testHandleRequest()
    {
        $instance = FederatedSearchInstanceTest::create([
            'url' => 'https://example.com',
            'remote_token' => encrypt('my_token'),
            'indexed_at' => null,
        ]);

        $container = [];
        $this->app->bind(Client::class, function () use (&$container) {
            $history = Middleware::history($container);
            $mock = new MockHandler([
                new Response(200, [], json_encode([
                    'label_trees' => [],
                    'projects' => [],
                    'volumes' => [],
                    'users' => [],
                ])),
            ]);

            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        UpdateFederatedSearchIndex::dispatchNow($instance);

        $this->assertCount(1, $container);
        $request = $container[0]['request'];
        $this->assertEquals('https://example.com/api/v1/federated-search-index', strval($request->getUri()));
        $this->assertEquals('Bearer my_token', $request->getHeaderLine('Authorization'));
        $this->assertNotNull($instance->fresh()->indexed_at);
    }

    public function testHandleFailedValidation()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => encrypt('my_token'),
        ]);

        $this->app->bind(Client::class, function () {
            $mock = new MockHandler([
                new Response(200, [], 'malformed'),
            ]);

            $handlerStack = HandlerStack::create($mock);

            return new Client(['handler' => $handlerStack]);
        });

        $this->expectException(Exception::class);
        UpdateFederatedSearchIndex::dispatchNow($instance);
    }

    public function testHandleLabelTrees()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => encrypt('my_token'),
        ]);

        $user = UserTest::create();

        $labelTree = [
            'id' => 123,
            'name' => 'remote tree',
            'description' => 'remote tree description',
            'created_at' => '2020-08-19 14:37:00',
            'updated_at' => '2020-08-19 14:37:00',
            'url' => '/label-trees/1',
            'members' => [321],
        ];

        $payload = [
            'label_trees' => [$labelTree],
            'projects' => [],
            'volumes' => [],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $this->app->bind(Client::class, function () use ($payload) {
            $response = new Response(200, ['Content-Type' => 'application/json'], json_encode($payload));

            $mock = new MockHandler([$response]);
            $handlerStack = HandlerStack::create($mock);

            return new Client(['handler' => $handlerStack]);
        });

        UpdateFederatedSearchIndex::dispatchNow($instance);

        $model = FederatedSearchModel::first();
        $this->assertNotNull($model);
        $this->assertEquals($labelTree['name'], $model->name);
        $this->assertEquals($labelTree['description'], $model->description);
        $this->assertEquals($labelTree['created_at'], $model->created_at);
        $this->assertEquals($labelTree['updated_at'], $model->updated_at);
        $this->assertEquals($labelTree['url'], $model->url);
        $this->assertEquals(LabelTree::class, $model->type);

        $this->assertTrue($user->federatedSearchModels()->exists());
    }

    public function testHandleProjects()
    {

    }

    public function testHandleVolumes()
    {

    }

    public function testHandleCleanupDanglingModels()
    {
        // Do not persist models that no user can access.
    }
}
