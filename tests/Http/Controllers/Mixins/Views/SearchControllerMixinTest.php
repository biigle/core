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
        $this->get('search?t=volumes')->assertResponseOk();
        $this->see('my volume');
        $this->see('other volume');
        $this->dontSee('third volume');

        $this->get('search?t=volumes&q=my')->assertResponseOk();
        $this->see('my volume');
        $this->dontSee('other volume');
        $this->dontSee('third volume');
    }
}
