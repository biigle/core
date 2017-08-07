<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Mixins\Views;

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
        $project->addUserId($user->id, Role::$guest->id);

        $image1 = ImageTest::create(['filename' => 'my image']);
        $project->addVolumeId($image1->volume_id);
        $image2 = ImageTest::create(['filename' => 'other image']);
        $project->addVolumeId($image2->volume_id);
        $image3 = ImageTest::create(['filename' => 'third image']);

        $this->be($user);
        $this->get('search?t=images')->assertResponseOk();
        $this->see('my image');
        $this->see('other image');
        $this->dontSee('third image');

        $this->get('search?t=images&q=my')->assertResponseOk();
        $this->see('my image');
        $this->dontSee('other image');
        $this->dontSee('third image');
    }
}
