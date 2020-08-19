<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\GenerateFederatedSearchIndex;
use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Cache;
use TestCase;

class GenerateFederatedSearchIndexTest extends TestCase
{
    public function testHandle()
    {
        GenerateFederatedSearchIndex::dispatchNow();
        $expect = [
            'label_trees' => [],
            'projects' => [],
            'volumes' => [],
            'users' => [],
        ];

        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals($expect, $index);
    }

    public function testHandleLabelTree()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::editor());
        GenerateFederatedSearchIndex::dispatchNow();
        $expectTrees = [
            [
                'id' => $tree->id,
                'name' => $tree->name,
                'description' => $tree->description,
                'created_at' => $tree->created_at,
                'updated_at' => $tree->updated_at,
                'url' => "/label-trees/{$tree->id}",
                'members' => [$user->id],
                'projects' => [],
            ],
        ];

        $expectUsers = [
            [
                'id' => $user->id,
                'uuid' => $user->uuid,
            ],
        ];
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals($expectTrees, $index['label_trees']);
        $this->assertEquals($expectUsers, $index['users']);
    }

    public function testHandleLabelTreeProjects()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::editor());
        $project = ProjectTest::create();
        $tree->projects()->attach($project);
        GenerateFederatedSearchIndex::dispatchNow();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals([$project->id], $index['label_trees'][0]['projects']);
    }

    public function testHandleLabelTreeVersion()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::editor());
        $version = LabelTreeVersionTest::create(['label_tree_id' => $tree->id]);
        LabelTreeTest::create(['version_id' => $version->id]);
        GenerateFederatedSearchIndex::dispatchNow();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertCount(1, $index['label_trees']);
        $this->assertEquals($version->label_tree_id, $index['label_trees'][0]['id']);
    }

    public function testHandleLabelTreeGlobal()
    {
        $tree = LabelTreeTest::create();
        GenerateFederatedSearchIndex::dispatchNow();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEmpty($index['label_trees']);
    }

    public function testHandleProject()
    {
        $project = ProjectTest::create();
        GenerateFederatedSearchIndex::dispatchNow();
        $expectProjects =  [
            [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'created_at' => $project->created_at,
                'updated_at' => $project->updated_at,
                'url' => "/projects/{$project->id}",
                'thumbnail_url' => $project->thumbnailUrl,
                'members' => [$project->creator_id],
            ]
        ];

        $expectUsers = [
            [
                'id' => $project->creator->id,
                'uuid' => $project->creator->uuid,
            ],
        ];
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals($expectProjects, $index['projects']);
        $this->assertEquals($expectUsers, $index['users']);
    }

    public function testHandleVolume()
    {
        $volume = VolumeTest::create();
        $project = ProjectTest::create();
        $volume->projects()->attach($project);

        GenerateFederatedSearchIndex::dispatchNow();
        $expect =  [
            [
                'id' => $volume->id,
                'name' => $volume->name,
                'created_at' => $volume->created_at,
                'updated_at' => $volume->updated_at,
                'url' => "/volumes/{$volume->id}",
                'thumbnail_url' => $volume->thumbnailUrl,
                'thumbnail_urls' => $volume->thumbnailUrls,
                'projects' => [$project->id],
            ]
        ];

        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals($expect, $index['volumes']);
    }

    public function testHandleUsers()
    {
        $user = UserTest::create();
        $project = ProjectTest::create();
        $tree = LabelTreeTest::create();
        $tree->addMember($project->creator, Role::admin());
        GenerateFederatedSearchIndex::dispatchNow();
        $expect = [
            [
                'id' => $project->creator->id,
                'uuid' => $project->creator->uuid,
            ],
        ];

        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEquals($expect, $index['users']);
    }
}
