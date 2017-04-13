<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class VolumeImageAnnotationLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = LabelTest::create();
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);
        // image ID should be returned only once, no matter how often the label is present
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);

        $lid = $label->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = AnnotationTest::create(['image_id' => $image2->id]);
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}");
        $this->assertResponseStatus(403);

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beGuest();
        $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->seeJsonEquals($expect);
        $this->assertResponseOk();
    }

    public function testIndexAnnotationSession()
    {
        $tid = $this->volume()->id;

        $session = AnnotationSessionTest::create([
            'volume_id' => $tid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $lid = $label->label_id;

        $expect = [$image->id];
        if ($this->isSqlite()) {
            $expect = array_map('strval', $expect);
        }

        $this->beEditor();
        $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->seeJsonEquals($expect);

        $session->users()->attach($this->editor());
        $this->get("/api/v1/volumes/{$tid}/images/filter/annotation-label/{$lid}")
            ->seeJsonEquals([]);
    }
}
