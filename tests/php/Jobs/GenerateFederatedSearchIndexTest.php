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
        (new GenerateFederatedSearchIndex)->handle();
        $expect = [
            'label_trees' => [],
            'projects' => [],
            'volumes' => [],
            'users' => [],
        ];

        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertSame($expect, $index);
    }

    public function testHandleLabelTree()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::editor());
        (new GenerateFederatedSearchIndex)->handle();
        $expectTrees = [
            [
                'id' => $tree->id,
                'name' => $tree->name,
                'description' => $tree->description,
                'created_at' => $tree->created_at,
                'updated_at' => $tree->updated_at,
                'url' => "/label-trees/{$tree->id}",
                'members' => [$user->id],
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
        $this->assertSame($expectUsers, $index['users']);
    }

    public function testHandleLabelTreeVersion()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::editor());
        $version = LabelTreeVersionTest::create(['label_tree_id' => $tree->id]);
        LabelTreeTest::create(['version_id' => $version->id]);
        (new GenerateFederatedSearchIndex)->handle();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertCount(1, $index['label_trees']);
        $this->assertSame($version->label_tree_id, $index['label_trees'][0]['id']);
    }

    public function testHandleLabelTreeGlobal()
    {
        $tree = LabelTreeTest::create();
        (new GenerateFederatedSearchIndex)->handle();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertEmpty($index['label_trees']);
    }

    public function testHandleProject()
    {
        $project = ProjectTest::create();
        (new GenerateFederatedSearchIndex)->handle();
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
                'label_trees' => [],
                'volumes' => [],
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
        $this->assertSame($expectUsers, $index['users']);
    }

    public function testHandleProjectLabelTrees()
    {
        $project = ProjectTest::create();
        $globalTree = LabelTreeTest::create();
        $project->labelTrees()->attach($globalTree);
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::editor());
        $project->labelTrees()->attach($tree);
        (new GenerateFederatedSearchIndex)->handle();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertSame([$tree->id], $index['projects'][0]['label_trees']);
    }

    public function testHandleProjectVolumes()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->volumes()->attach($volume);
        (new GenerateFederatedSearchIndex)->handle();
        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertSame([$volume->id], $index['projects'][0]['volumes']);
    }

    public function testHandleVolume()
    {
        $volume = VolumeTest::create();

        (new GenerateFederatedSearchIndex)->handle();
        $expect =  [
            [
                'id' => $volume->id,
                'name' => $volume->name,
                'created_at' => $volume->created_at,
                'updated_at' => $volume->updated_at,
                'url' => "/volumes/{$volume->id}",
                'thumbnail_url' => $volume->thumbnailUrl,
                'thumbnail_urls' => $volume->thumbnailsUrl,
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
        (new GenerateFederatedSearchIndex)->handle();
        $expect = [
            [
                'id' => $project->creator->id,
                'uuid' => $project->creator->uuid,
            ],
        ];

        $index = Cache::get(config('biigle.federated_search.cache_key'));
        $this->assertSame($expect, $index['users']);
    }
}
