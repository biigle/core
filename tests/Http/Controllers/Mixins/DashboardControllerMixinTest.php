<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Mixins;

use ApiTestCase;
use Biigle\Tests\UserTest;
use Biigle\Modules\Videos\Video;
use Biigle\Tests\Modules\Videos\VideoAnnotationLabelTest;
use Biigle\Modules\Videos\Http\Controllers\Mixins\DashboardControllerMixin;

class DashboardControllerMixinTest extends ApiTestCase
{
    public function testActivityItems()
    {
        $controller = new DashboardControllerMixin;
        $user = UserTest::create();

        $items = $controller->activityItems($user, 1);
        $this->assertEmpty($items);

        $a = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $items = $controller->activityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Video::class, $items[0]['item']);

        $items = $controller->activityItems($user, 3);
        $this->assertCount(3, $items);

        $a->created_at = $a->created_at->subDay();
        $a->save();
        $items = $controller->activityItems($user, 3, $a->created_at);
        $this->assertCount(2, $items);

        VideoAnnotationLabelTest::create([
            'user_id' => $user->id,
            'video_annotation_id' => $a->video_annotation_id,
        ]);

        $items = $controller->activityItems($user, 3);
        $this->assertCount(3, $items);

    }
}
