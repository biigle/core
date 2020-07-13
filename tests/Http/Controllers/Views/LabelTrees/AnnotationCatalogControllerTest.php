<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Views\LabelTrees;

use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use Cache;
use TestCase;

class AnnotationCatalogControllerTest extends TestCase
{
    public function testIndex()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);

        $this->get("label-trees/{$tree->id}/catalog")->assertStatus(302);

        $user = UserTest::create();
        $this->be($user);
        $this->get("label-trees/{$tree->id}/catalog")->assertStatus(403);

        $tree->addMember($user, Role::admin());
        Cache::flush();
        $this->get("label-trees/{$tree->id}/catalog")->assertStatus(200);
    }
}
