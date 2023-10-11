<?php

namespace Biigle\Tests\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\DashboardController;
use Biigle\Image;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Support\Facades\View;
use TestCase;

class DashboardControllerTest extends TestCase
{
    public function testDashboard()
    {
        $this->get('/')->assertRedirect('login');
        $user = UserTest::create();
        $this->actingAs($user)->get('/')->assertSee('Signed in as');
    }

    public function testLandingPage()
    {
        View::getFinder()->addLocation(__DIR__.'/templates');
        $this->get('/')->assertSee('Landing Page');
        $user = UserTest::create();
        $this->actingAs($user)->get('/')
            ->assertSee('Signed in as')
            ->assertDontSee('Landing Page');
    }

    public function testVolumeActivityItems()
    {
        $controller = new DashboardController;
        $user = UserTest::create();

        $items = $controller->volumesActivityItems($user, 1);
        $this->assertEmpty($items);

        $v = VolumeTest::create(['creator_id' => $user->id]);
        VolumeTest::create(['creator_id' => $user->id]);
        VolumeTest::create(['creator_id' => $user->id]);
        $items = $controller->volumesActivityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Volume::class, $items[0]['item']);

        $items = $controller->volumesActivityItems($user, 3);
        $this->assertCount(3, $items);

        $v->created_at = $v->created_at->subDay();
        $v->save();
        $items = $controller->volumesActivityItems($user, 3, $v->created_at);
        $this->assertCount(2, $items);
    }

    public function testAnnotationsActivityItems()
    {
        $controller = new DashboardController;
        $user = UserTest::create();

        $items = $controller->annotationsActivityItems($user, 1);
        $this->assertEmpty($items);

        $a = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $items = $controller->annotationsActivityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Image::class, $items[0]['item']);

        $items = $controller->annotationsActivityItems($user, 3);
        $this->assertCount(3, $items);

        $a->created_at = $a->created_at->subDay();
        $a->save();
        $items = $controller->annotationsActivityItems($user, 3, $a->created_at);
        $this->assertCount(2, $items);

        ImageAnnotationLabelTest::create([
            'user_id' => $user->id,
            'annotation_id' => $a->annotation_id,
        ]);

        $items = $controller->annotationsActivityItems($user, 3);
        $this->assertCount(3, $items);
    }

    public function testVideosActivityItems()
    {
        $controller = new DashboardController;
        $user = UserTest::create();

        $items = $controller->videosActivityItems($user, 1);
        $this->assertEmpty($items);

        $a = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $items = $controller->videosActivityItems($user, 1);
        $this->assertCount(1, $items);
        $this->assertArrayHasKey('item', $items[0]);
        $this->assertArrayHasKey('created_at', $items[0]);
        $this->assertArrayHasKey('include', $items[0]);
        $this->assertInstanceOf(Video::class, $items[0]['item']);

        $items = $controller->videosActivityItems($user, 3);
        $this->assertCount(3, $items);

        $a->created_at = $a->created_at->subDay();
        $a->save();
        $items = $controller->videosActivityItems($user, 3, $a->created_at);
        $this->assertCount(2, $items);

        VideoAnnotationLabelTest::create([
            'user_id' => $user->id,
            'annotation_id' => $a->annotation_id,
        ]);

        $items = $controller->videosActivityItems($user, 3);
        $this->assertCount(3, $items);
    }
}
