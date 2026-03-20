<?php
namespace Biigle\Tests\Http\Controllers\Views\Projects;

use ApiTestCase;
use Biigle\AnnotationStrategy;

class AnnotationStrategyControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $path = "projects/{$id}/annotation-strategy";

        $this->beGuest();
        $this->get($path)->assertStatus(404);

        $this->beEditor();
        $this->get($path)->assertStatus(404);

        //Admins can create annotation strategies
        $this->beAdmin();
        $this->get($path)->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get($path)->assertStatus(200);

        AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);

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
