<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;

class SearchControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('search')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $this->actingAs(UserTest::create())->get('search')->assertViewIs('search.index');
    }

    public function testIndexLabelTrees()
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

    public function testIndexLabelTreesAccessViaProject()
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

    public function testIndexLabelTreesHideVersions()
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
