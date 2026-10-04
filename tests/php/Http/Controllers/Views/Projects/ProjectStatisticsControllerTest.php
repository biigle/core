<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Cache;
use TestCase;

class ProjectStatisticsControllerTest extends TestCase
{
    public function testShow()
    {
        $project = ProjectTest::create();
        $id = $project->id;
        $user = UserTest::create();

        $this->get("projects/{$id}/charts")->assertStatus(302);

        $this->be($user);
        $this->get("projects/{$id}/charts")->assertStatus(403);

        $project->addUserId($user->id, Role::editorId());
        Cache::flush();
        $this->get("projects/{$id}/charts")->assertStatus(200);

        // doesn't exist
        $this->get('projects/-1/charts')->assertStatus(404);
    }

    public function testShowStatistics()
    {
        $project = ProjectTest::create();
        $volume1 = VolumeTest::create();
        $volume2 = VolumeTest::create();
        $project->addVolumeId($volume1->id);
        $project->addVolumeId($volume2->id);
        // Volume that does not belong to the project.
        $otherImage = ImageTest::create();

        $user = UserTest::create();
        $project->addUserId($user->id, Role::editorId());
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();

        $image1 = ImageTest::create(['volume_id' => $volume1->id]);
        $image2 = ImageTest::create(['volume_id' => $volume2->id]);
        $a1 = ImageAnnotationTest::create(['image_id' => $image1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $label1->id, 'user_id' => $user->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image1->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $label2->id, 'user_id' => $user->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image2->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $label1->id, 'user_id' => $user->id]);
        $a4 = ImageAnnotationTest::create(['image_id' => $otherImage->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a4->id, 'label_id' => $label2->id, 'user_id' => $user->id]);

        $this->be($user);
        $response = $this->get("projects/{$project->id}/charts")->assertStatus(200);

        $fullname = "{$user->firstname} {$user->lastname}";
        $yearmonth = $a1->created_at->format('Y-m');
        $toArray = fn ($items) => collect($items)->map(fn ($item) => (array) $item)->all();

        $response->assertViewHas('annotatedImages', 2);
        $response->assertViewHas('totalImages', 2);
        $this->assertSame([
            ['user_id' => $user->id, 'fullname' => $fullname, 'count' => 3, 'yearmonth' => $yearmonth],
        ], $toArray($response->viewData('annotationTimeSeries')));
        $this->assertSame([
            ['user_id' => $user->id, 'fullname' => $fullname, 'count' => 2, 'volume_id' => $volume1->id],
            ['user_id' => $user->id, 'fullname' => $fullname, 'count' => 1, 'volume_id' => $volume2->id],
        ], $toArray($response->viewData('volumeAnnotations')));
        $this->assertSame([
            ['id' => $label1->id, 'name' => $label1->name, 'count' => 2, 'color' => $label1->color],
            ['id' => $label2->id, 'name' => $label2->name, 'count' => 1, 'color' => $label2->color],
        ], $toArray($response->viewData('annotationLabels')));
        $this->assertSame([$label1->id => [$label2->id]], $response->viewData('sourceTargetLabels')->all());
        $response->assertViewHas('annotatedVideos', 0);
        $this->assertSame([], $response->viewData('sourceTargetLabelsVideo')->all());
    }
}
