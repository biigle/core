<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\ImageTest;

class LargoControllerTestBase extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->url = $this->getUrl();
        // make sure the label tree and label are set up
        $this->labelRoot();

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $this->annotation = AnnotationTest::create(['image_id' => $image->id]);

        $this->label = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ]);
    }

    public function testRoute()
    {
        $this->doTestApiRoute('POST', $this->url);
    }

    public function testErrors()
    {
        $this->beUser();
        $response = $this->post($this->url, []);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post($this->url, []);
        $response->assertStatus(403);

        // Annotation from other volume should not be affected.
        $other = AnnotationTest::create();

        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
            ],
            'changed' => [
                $this->labelRoot()->id => [$other->id],
            ],
        ]);
        // a4 does not belong to the same volume
        $response->assertStatus(400);

        $otherLabel = AnnotationLabelTest::create();

        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
            ],
            'changed' => [
                $otherLabel->label_id => [$this->annotation->id],
            ],
        ]);
        // a label in 'changed' does not belong to a label tree available for the volume
        $response->assertStatus(403);
    }

    public function testDismiss()
    {
        $this->expectsJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
        ]);
        $response->assertStatus(200);

        // a1 was dismissed but not changed, should be deleted.
        $this->assertNull($this->label->fresh());
        $this->assertNull($this->annotation->fresh());
    }

    public function testDismissForceDeny()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $this->label->user_id = $this->admin()->id;
        $this->label->save();
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
            'force' => true,
        ]);
        $response->assertStatus(403);
    }

    public function testDismissForce()
    {
        $this->expectsJobs(RemoveAnnotationPatches::class);
        $this->beExpert();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
            'force' => true,
        ]);
        $response->assertStatus(200);
        $this->assertNull($this->label->fresh());
        $this->assertNull($this->annotation->fresh());
    }

    public function testChangeOwn()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [
                $this->labelRoot()->id => [$this->annotation->id],
            ],
        ]);
        $response->assertStatus(200);

        // a1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($this->label->fresh());
        $this->assertEquals($this->labelRoot()->id, $this->annotation->labels()->first()->label_id);
    }

    public function testChangeOther()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $this->beAdmin();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [
                $this->labelRoot()->id => [$this->annotation->id],
            ],
        ]);
        $response->assertStatus(200);

        // a1 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label.
        $this->assertNotNull($this->label->fresh());
        $this->assertNotNull($this->annotation->fresh());
        $this->assertEquals(2, $this->annotation->labels()->count());
    }

    public function testChangeOtherForce()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $this->beExpert();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [
                $this->labelRoot()->id => [$this->annotation->id],
            ],
            'force' => true,
        ]);
        $response->assertStatus(200);

        $this->assertNull($this->label->fresh());
        $this->assertNotNull($this->annotation->fresh());
        $this->assertEquals($this->labelRoot()->id, $this->annotation->labels()->first()->label_id);
    }

    public function testChangeMultiple()
    {
        $label2 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
                $label2->label_id => [$this->annotation->id],
            ],
            'changed' => [
                $this->labelRoot()->id => [$this->annotation->id],
                $this->labelChild()->id => [$this->annotation->id],
            ],
        ]);
        $response->assertStatus(200);

        $this->assertNull($this->label->fresh());
        $this->assertNull($label2->fresh());
        $this->assertNotNull($this->annotation->fresh());
        $labels = $this->annotation->labels()->pluck('label_id');
        $this->assertCount(2, $labels);
        $this->assertContains($this->labelRoot()->id, $labels);
        $this->assertContains($this->labelChild()->id, $labels);
    }
}
