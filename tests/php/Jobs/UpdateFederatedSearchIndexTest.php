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
            'remote_token' => 'my_token',
            'indexed_at' => null,
        ]);

        $container = &$this->mockResponse([
            'label_trees' => [],
            'projects' => [],
            'volumes' => [],
            'users' => [],
        ]);

        (new UpdateFederatedSearchIndex($instance))->handle();

        $this->assertCount(1, $container);
        $request = $container[0]['request'];
        $this->assertEquals('https://example.com/api/v1/federated-search-index', strval($request->getUri()));
        $this->assertEquals('Bearer my_token', $request->getHeaderLine('Authorization'));
        $this->assertNotNull($instance->fresh()->indexed_at);
    }

    public function testHandleMissingToken()
    {
        $instance = FederatedSearchInstanceTest::create([
            'url' => 'https://example.com',
            'indexed_at' => null,
        ]);

        $container = &$this->mockResponse([]);

        (new UpdateFederatedSearchIndex($instance))->handle();

        $this->assertCount(0, $container);
    }

    public function testHandleFailedValidation()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $this->mockResponse(['malformed']);
        $this->expectException(Exception::class);
        (new UpdateFederatedSearchIndex($instance))->handle();
    }

    public function testHandleLabelTrees()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
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

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();

        $model = FederatedSearchModel::first();
        $this->assertNotNull($model);
        $this->assertEquals($labelTree['name'], $model->name);
        $this->assertEquals($labelTree['description'], $model->description);
        $this->assertEquals($labelTree['created_at'], $model->created_at);
        $this->assertEquals($labelTree['updated_at'], $model->updated_at);
        $this->assertEquals($instance->url.$labelTree['url'], $model->url);
        $this->assertEquals(LabelTree::class, $model->type);

        $this->assertTrue($user->federatedSearchModels()->exists());
    }

    public function testHandleProjects()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $user = UserTest::create();

        $project = [
            'id' => 123,
            'name' => 'remote project',
            'description' => 'remote project description',
            'created_at' => '2020-08-20 07:01:00',
            'updated_at' => '2020-08-20 07:01:00',
            'url' => '/projects/1',
            'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
            'members' => [321],
            'label_trees' => [],
            'volumes' => [],
        ];

        $payload = [
            'label_trees' => [],
            'projects' => [$project],
            'volumes' => [],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();

        $model = FederatedSearchModel::first();
        $this->assertNotNull($model);
        $this->assertEquals($project['name'], $model->name);
        $this->assertEquals($project['description'], $model->description);
        $this->assertEquals($project['created_at'], $model->created_at);
        $this->assertEquals($project['updated_at'], $model->updated_at);
        $this->assertEquals($instance->url.$project['url'], $model->url);
        $this->assertEquals($project['thumbnail_url'], $model->thumbnailUrl);
        $this->assertEquals(Project::class, $model->type);

        $this->assertTrue($user->federatedSearchModels()->projects()->exists());
    }

    public function testHandleProjectLabelTrees()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $user = UserTest::create();

        $payload = [
            'label_trees' => [[
                'id' => 456,
                'name' => 'remote tree',
                'description' => 'remote tree description',
                'created_at' => '2020-08-19 14:37:00',
                'updated_at' => '2020-08-19 14:37:00',
                'url' => '/label-trees/1',
                'members' => [],
            ]],
            'projects' => [[
                'id' => 123,
                'name' => 'remote project',
                'description' => 'remote project description',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/projects/1',
                'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
                'members' => [321],
                'label_trees' => [456],
                'volumes' => [],
            ]],
            'volumes' => [],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();
        // The user has access to the label tree through the project membership although
        // they are not a member of the label tree.
        $this->assertTrue($user->federatedSearchModels()->labelTrees()->exists());
    }

    public function testHandleProjectVolumes()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $user = UserTest::create();

        $payload = [
            'label_trees' => [],
            'projects' => [[
                'id' => 123,
                'name' => 'remote project',
                'description' => 'remote project description',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/projects/1',
                'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
                'members' => [321],
                'label_trees' => [],
                'volumes' => [789],
            ]],
            'volumes' => [[
                'id' => 789,
                'name' => 'remote volume',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/volumes/1',
                'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
                'thumbnail_urls' => [
                    'https://example.com/thumbs/1.jpg',
                    'https://example.com/thumbs/2.jpg',
                ],
            ]],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();
        $this->assertTrue($user->federatedSearchModels()->volumes()->exists());
    }

    public function testHandleVolumes()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $user = UserTest::create();

        $volume = [
            'id' => 123,
            'name' => 'remote volume',
            'created_at' => '2020-08-20 07:01:00',
            'updated_at' => '2020-08-20 07:01:00',
            'url' => '/volumes/1',
            'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
            'thumbnail_urls' => [
                'https://example.com/thumbs/1.jpg',
                'https://example.com/thumbs/2.jpg',
            ],
        ];

        $payload = [
            'label_trees' => [],
            'projects' => [[
                'id' => 321,
                'name' => 'remote project',
                'description' => 'remote project description',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/projects/1',
                'thumbnail_url' => null,
                'members' => [321],
                'label_trees' => [],
                'volumes' => [123],
            ]],
            'volumes' => [$volume],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();

        $model = FederatedSearchModel::where('name', 'remote volume')->first();
        $this->assertNotNull($model);
        $this->assertEquals($volume['name'], $model->name);
        $this->assertNull($model->description);
        $this->assertEquals($volume['created_at'], $model->created_at);
        $this->assertEquals($volume['updated_at'], $model->updated_at);
        $this->assertEquals($instance->url.$volume['url'], $model->url);
        $this->assertEquals($volume['thumbnail_url'], $model->thumbnailUrl);
        $this->assertEquals($volume['thumbnail_urls'], $model->thumbnailUrls->toArray());
        $this->assertEquals(Volume::class, $model->type);
    }

    public function testHandleCleanupDanglingModels()
    {
        $instance = FederatedSearchInstanceTest::create([
            'remote_token' => 'my_token',
        ]);

        $user = UserTest::create();

        $payload = [
            'label_trees' => [[
                'id' => 123,
                'name' => 'remote tree',
                'description' => 'remote tree description',
                'created_at' => '2020-08-19 14:37:00',
                'updated_at' => '2020-08-19 14:37:00',
                'url' => '/label-trees/1',
                'members' => [321],
            ]],
            'projects' => [[
                'id' => 123,
                'name' => 'remote project',
                'description' => 'remote project description',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/projects/1',
                'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
                'members' => [321],
                'label_trees' => [123],
                'volumes' => [789],
            ]],
            'volumes' => [[
                'id' => 789,
                'name' => 'remote volume',
                'created_at' => '2020-08-20 07:01:00',
                'updated_at' => '2020-08-20 07:01:00',
                'url' => '/volumes/1',
                'thumbnail_url' => 'https://example.com/thumbs/1.jpg',
                'thumbnail_urls' => [
                    'https://example.com/thumbs/1.jpg',
                    'https://example.com/thumbs/2.jpg',
                ],
            ]],
            'users' => [
                [
                    'id' => 321,
                    'uuid' => $user->uuid,
                ],
            ],
        ];

        $user->delete();

        $this->mockResponse($payload);

        (new UpdateFederatedSearchIndex($instance))->handle();
        $this->assertFalse(FederatedSearchModel::exists());
    }

    protected function &mockResponse($payload)
    {
        $container = [];
        $this->app->bind(Client::class, function () use ($payload, &$container) {
            $response = new Response(200, ['Content-Type' => 'application/json'], json_encode($payload));

            $history = Middleware::history($container);
            $mock = new MockHandler([$response]);

            $handlerStack = HandlerStack::create($mock);
            $handlerStack->push($history);

            return new Client(['handler' => $handlerStack]);
        });

        return $container;
    }
}
