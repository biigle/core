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
        $this->get('search?t=label-trees')->assertResponseOk();
        $this->see('random name');
        $this->see('another tree');
        $this->dontSee('private one');

        $this->get('search?t=label-trees&q=name')->assertResponseOk();
        $this->assertResponseOk();
        $this->see('random name');
        $this->dontSee('another tree');
        $this->dontSee('private one');
    }
}
