<?php

namespace Biigle\Tests\Modules\LabelTrees\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTreeTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $tree = LabelTreeTest::create(['name' => 'random name']);
        $tree2 = LabelTreeTest::create(['name' => 'another tree']);
        $tree3 = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::$private->id,
        ]);
        $tree->addMember($user, Role::$editor);

        $this->be($user);
        $response = $this->get('search?t=label-trees')->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertSeeText('another tree');
        $response->assertDontSeeText('private one');

        $response = $this->get('search?t=label-trees&q=name')->assertStatus(200);
        $response->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertDontSeeText('another tree');
        $response->assertDontSeeText('private one');
    }
}
