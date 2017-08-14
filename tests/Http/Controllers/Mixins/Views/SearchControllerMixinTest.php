<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::$guest->id);

        $volume1 = VolumeTest::create(['name' => 'my volume']);
        $project->addVolumeId($volume1->id);
        $volume2 = VolumeTest::create(['name' => 'other volume']);
        $project->addVolumeId($volume2->id);
        $volume3 = VolumeTest::create(['name' => 'third volume']);

        $this->be($user);
        $response = $this->get('search?t=volumes')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertSeeText('other volume');
        $response->assertDontSeeText('third volume');

        $response = $this->get('search?t=volumes&q=my')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertDontSeeText('other volume');
        $response->assertDontSeeText('third volume');
    }
}
