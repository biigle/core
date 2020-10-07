<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Jobs\ApplyLargoSession;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
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
        $this->annotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $this->label = ImageAnnotationLabelTest::create([
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
        $other = ImageAnnotationTest::create();

        $this->beEditor();
        $response = $this->postJson($this->url, [
            'dismissed' => [
            ],
            'changed' => [
                $this->labelRoot()->id => [$other->id],
            ],
        ]);
        // a4 does not belong to the same volume
        $response->assertStatus(422);

        $otherLabel = ImageAnnotationLabelTest::create();

        $this->beEditor();
        $response = $this->postJson($this->url, [
            'dismissed' => [
            ],
            'changed' => [
                $otherLabel->label_id => [$this->annotation->id],
            ],
        ]);
        // a label in 'changed' does not belong to a label tree available for the volume
        $response->assertStatus(422);
    }

    public function testDismiss()
    {
        $this->expectsJobs(ApplyLargoSession::class);
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
        ]);
        $response->assertStatus(200);
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
        $this->expectsJobs(ApplyLargoSession::class);
        $this->beExpert();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
            'force' => true,
        ]);
        $response->assertStatus(200);
    }

    public function testChangeOwn()
    {
        $this->expectsJobs(ApplyLargoSession::class);
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
    }

    public function testChangeOther()
    {
        $this->expectsJobs(ApplyLargoSession::class);
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
    }

    public function testChangeOtherForce()
    {
        $this->expectsJobs(ApplyLargoSession::class);
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
    }

    public function testChangeMultiple()
    {
        $label2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->expectsJobs(ApplyLargoSession::class);
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
    }
}
