<?php

namespace Dias\Tests\Modules\Ate\Http\Controllers\Api;

use ApiTestCase;
use Dias\Tests\ImageTest;
use Dias\Tests\AnnotationTest;
use Dias\Tests\AnnotationLabelTest;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;

class AteControllerTest extends ApiTestCase
{
    public function testSaveTransect()
    {
        $id = $this->transect()->id;
        // make sure the label tree and label are set up
        $this->labelRoot();

        $image = ImageTest::create(['transect_id' => $id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other transect should not be affected
        $a4 = AnnotationTest::create();
        $l4 = AnnotationLabelTest::create(['annotation_id' => $a4->id]);

        $this->doTestApiRoute('POST', "/api/v1/transects/{$id}/ate");

        $this->beUser();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
                $a4->id => $this->labelRoot()->id,
            ]
        ]);
        // a4 does not belong to the same transect
        $this->assertResponseStatus(400);

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $l3->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        // a label in 'changed' does not belong to a label tree available for the transect
        $this->assertResponseStatus(403);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseOk();

        // a1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($l1->fresh());
        $this->assertNotNull($a1->fresh());
        $this->assertEquals($this->labelRoot()->id, $a1->labels()->first()->label_id);

        // a2 was dismissed but not changed, should be deleted
        $this->assertNull($l2->fresh());
        $this->assertNull($a2->fresh());

        // a3 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label
        $this->assertNotNull($l3->fresh());
        $this->assertNotNull($a3->fresh());
        $this->assertEquals(2, $a3->labels()->count());

        // should not be affected
        $this->assertNotNull($l4->fresh());
        $this->assertNotNull($a4->fresh());
    }

    public function testSaveProject()
    {
        $id = $this->project()->id;
        // make sure the label tree and label are set up
        $this->labelRoot();

        $image = ImageTest::create(['transect_id' => $this->transect()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $a3 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);
        $l3 = AnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other project should not be affected
        $a4 = AnnotationTest::create();
        $l4 = AnnotationLabelTest::create(['annotation_id' => $a4->id]);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/ate");

        $this->beUser();
        $this->post("/api/v1/projects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/projects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/projects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
                $a4->id => $this->labelRoot()->id,
            ]
        ]);
        // a4 does not belong to the same project
        $this->assertResponseStatus(400);

        $this->beEditor();
        $this->post("/api/v1/projects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $l3->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        // a label in 'changed' does not belong to a label tree available for the project
        $this->assertResponseStatus(403);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $this->post("/api/v1/projects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
                $l3->label_id => [$a3->id],
            ],
            'changed' => [
                $a1->id => $this->labelRoot()->id,
                $a3->id => $this->labelRoot()->id,
            ]
        ]);
        $this->assertResponseOk();

        // a1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($l1->fresh());
        $this->assertNotNull($a1->fresh());
        $this->assertEquals($this->labelRoot()->id, $a1->labels()->first()->label_id);

        // a2 was dismissed but not changed, should be deleted
        $this->assertNull($l2->fresh());
        $this->assertNull($a2->fresh());

        // a3 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label
        $this->assertNotNull($l3->fresh());
        $this->assertNotNull($a3->fresh());
        $this->assertEquals(2, $a3->labels()->count());

        // should not be affected
        $this->assertNotNull($l4->fresh());
        $this->assertNotNull($a4->fresh());
    }

    public function testSaveChangedAlreadyExists()
    {
        $id = $this->transect()->id;
        $image = ImageTest::create(['transect_id' => $this->transect()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelChild()->id,
        ]);

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/ate", [
            'dismissed' => [
                $l1->label_id => [$a1->id],
            ],
            'changed' => [
                $a1->id => $l2->label_id, // but this already exists from the same user!
            ]
        ]);
        $this->assertResponseOk();

        $this->assertEquals(1, $a1->labels()->count());
        $this->assertEquals($l2->id, $a1->labels()->first()->id);
    }

    public function testAnnotationMeanwhileDeleted()
    {
        $id = $this->transect()->id;
        $image = ImageTest::create(['transect_id' => $this->transect()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
            ],
            'changed' => [
                $a1->id => $this->labelChild()->id,
                $a2->id => $this->labelChild()->id,
            ]
        ];

        // annotation was deleted during the Ate session but saving should still work
        $a2->delete();

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/ate", $request);
        $this->assertResponseOk();
        $this->assertEquals($this->labelChild()->id, $a1->labels()->first()->label_id);
    }
}
