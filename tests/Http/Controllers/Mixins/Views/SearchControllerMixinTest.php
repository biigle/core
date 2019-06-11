<?php

namespace Biigle\Tests\Modules\LabelTrees\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $tree = LabelTreeTest::create(['name' => 'random name']);
        $tree2 = LabelTreeTest::create(['name' => 'another tree']);
        $tree3 = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::privateId(),
        ]);
        $tree->addMember($user, Role::editor());

        $this->be($user);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertSeeText('random name')
            ->assertSeeText('another tree')
            ->assertDontSeeText('private one');

        $this->get('search?t=label-trees&q=name')
            ->assertStatus(200)
            ->assertSeeText('random name')
            ->assertDontSeeText('another tree')
            ->assertDontSeeText('private one');
    }

    public function testIndexAccessViaProject()
    {
        $tree = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::privateId(),
        ]);

        $project = ProjectTest::create();

        $this->be($project->creator);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('private one');

        $project->labelTrees()->attach($tree);

        $this->get('search?t=label-trees')->assertSeeText('private one');
    }

    public function testIndexHideVersions()
    {
        $user = UserTest::create();
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create([
            'name' => 'random name',
            'version_id' => $version->id,
        ]);

        $this->be($user);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('random name');
    }
}
