<?php

namespace Biigle\Tests\Http\Controllers\Views\LabelTrees;

use Biigle\Enums\Visibility;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use TestCase;

class LabelTreeProjectsControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility' => Visibility::PUBLIC]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility' => Visibility::PRIVATE]);

        $response = $this->get("label-trees/{$tree->id}/projects");
        $response->assertRedirect('login');

        $this->be($user);
        $response = $this->get("label-trees/{$tree->id}/projects");
        $response->assertStatus(200);

        $response = $this->get("label-trees/{$privateTree->id}/projects");
        $response->assertStatus(403);
    }
}
