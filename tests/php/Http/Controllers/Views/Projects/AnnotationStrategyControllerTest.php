<?php
namespace Biigle\Tests\Http\Controllers\Views;

use ApiTestCase;
use Biigle\AnnotationStrategy;

class AnnotationStrategyControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $path = "projects/{$id}/annotation-strategy";
        $this->get($path)->assertStatus(302);

        $this->beGuest();
        $this->get($path)->assertStatus(403);

        $this->beEditor();
        $this->get($path)->assertStatus(404);

        AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);

        $this->get($path)->assertStatus(200);

        $this->beAdmin();
        $this->get($path)->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get($path)->assertStatus(200);
    }
}
