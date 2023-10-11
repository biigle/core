<?php

namespace Biigle\Tests\Http\Controllers\Views\Annotations;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class AnnotationToolControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        // not logged in
        $response = $this->get("images/{$image->id}/annotations");
        $response->assertStatus(302);

        // doesn't belong to project
        $this->beUser();
        $response = $this->get("images/{$image->id}/annotations");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("images/{$image->id}/annotations");
        $response->assertStatus(200);
        $response->assertViewHas('user');
        $response->assertViewHas('image');

        // doesn't exist
        $response = $this->get('images/-1/annotations');
        $response->assertStatus(404);
    }

    public function testShowRedirect()
    {
        $this->beUser();
        $this->get("annotate/999")->assertRedirect('/images/999/annotations');
    }
}
