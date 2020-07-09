<?php

namespace Biigle\Tests\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Image;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Http\Controllers\Mixins\Views\DashboardControllerMixin;

class DashboardControllerMixinTest extends TestCase
{
    public function testActivityItems()
    {
        $controller = new DashboardControllerMixin;
        $user = UserTest::create();

        $items = $controller->activityItems($user, 1);
        $this->assertEmpty($items);

        $a = AnnotationLabelTest::create(['user_id' => $user->id]);
        AnnotationLabelTest::create(['user_id' => $user->id]);
        AnnotationLabelTest::create(['user_id' => $user->id]);
        $items = $controller->activityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Image::class, $items[0]['item']);

        $items = $controller->activityItems($user, 3);
        $this->assertCount(3, $items);

        $a->created_at = $a->created_at->subDay();
        $a->save();
        $items = $controller->activityItems($user, 3, $a->created_at);
        $this->assertCount(2, $items);

        AnnotationLabelTest::create([
            'user_id' => $user->id,
            'annotation_id' => $a->annotation_id,
        ]);

        $items = $controller->activityItems($user, 3);
        $this->assertCount(3, $items);
    }
}
