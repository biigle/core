<?php

namespace Biigle\Tests\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::guestId());

        $image1 = ImageTest::create(['filename' => 'my image']);
        $project->addVolumeId($image1->volume_id);
        $image2 = ImageTest::create(['filename' => 'other image']);
        $project->addVolumeId($image2->volume_id);
        $image3 = ImageTest::create(['filename' => 'third image']);

        $this->be($user);
        $response = $this->get('search?t=images')->assertStatus(200);
        $response->assertSeeText('my image');
        $response->assertSeeText('other image');
        $response->assertDontSeeText('third image');

        $response = $this->get('search?t=images&q=my')->assertStatus(200);
        $response->assertSeeText('my image');
        $response->assertDontSeeText('other image');
        $response->assertDontSeeText('third image');
    }
}
