<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Volume;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\Modules\Volumes\Http\Controllers\Mixins\Views\DashboardControllerMixin;

class DashboardControllerMixinTest extends TestCase
{
    public function testActivityItems()
    {
        $controller = new DashboardControllerMixin;
        $user = UserTest::create();

        $items = $controller->activityItems($user, 1);
        $this->assertEmpty($items);

        $v = VolumeTest::create(['creator_id' => $user->id]);
        VolumeTest::create(['creator_id' => $user->id]);
        VolumeTest::create(['creator_id' => $user->id]);
        $items = $controller->activityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Volume::class, $items[0]['item']);

        $items = $controller->activityItems($user, 3);
        $this->assertCount(3, $items);

        $v->created_at = $v->created_at->subDay();
        $v->save();
        $items = $controller->activityItems($user, 3, $v->created_at);
        $this->assertCount(2, $items);
    }
}
