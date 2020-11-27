<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use TestCase;

class LabelTreeProjectsControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);

        $response = $this->get("label-trees/{$tree->id}/projects");
        $response->assertRedirect('login');

        $this->be($user);
        $response = $this->get("label-trees/{$tree->id}/projects");
        $response->assertStatus(200);

        $response = $this->get("label-trees/{$privateTree->id}/projects");
        $response->assertStatus(403);
    }
}
