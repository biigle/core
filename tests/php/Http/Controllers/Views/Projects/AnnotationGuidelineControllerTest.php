<?php
namespace Biigle\Tests\Http\Controllers\Views\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;

class AnnotationGuidelineControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $path = "projects/{$id}/annotation-guideline";

        $this->beGuest();
        $this->get($path)->assertStatus(404);

        $this->beEditor();
        $this->get($path)->assertStatus(404);

        //Admins can create annotation guidelines
        $this->beAdmin();
        $this->get($path)->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get($path)->assertStatus(200);

        AnnotationGuideline::factory()->create(['project_id' => $id, 'description' => 'someDescription']);

        $this->beGuest();
        $this->get($path)->assertStatus(200);

        $this->beEditor();
        $this->get($path)->assertStatus(200);

        $this->beAdmin();
        $this->get($path)->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get($path)->assertStatus(200);

    }

    public function testPrintable()
    {
        $id = $this->project()->id;

        $path = "projects/{$id}/annotation-guideline/print";

        $this->beUser();
        $this->get($path)->assertStatus(403);

        // There is nothing to print without a guideline.
        $this->beAdmin();
        $this->get($path)->assertStatus(404);

        AnnotationGuideline::factory()->create(['project_id' => $id]);

        $this->beUser();
        $this->get($path)->assertStatus(403);

        $this->beGuest();
        $this->get($path)->assertStatus(200);

        $this->beEditor();
        $this->get($path)->assertStatus(200);

        $this->beAdmin();
        $this->get($path)->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get($path)->assertStatus(200);
    }
}
