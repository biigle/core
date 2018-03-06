<?php

namespace Biigle\Tests\Modules\Annotations\Http\Controllers\Api;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class ImageAreaControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->doTestApiRoute('GET', "/api/v1/images/{$image->id}/area");

        $this->beUser();
        $this->get("/api/v1/images/{$image->id}/area")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/images/{$image->id}/area")
            ->assertStatus(200)
            ->assertSee('-1');

        $image->metadata = ['area' => 4.2];
        $image->save();

        $this->get("/api/v1/images/{$image->id}/area")->assertSee('4.2');

        $image->attrs = ['laserpoints' => ['area' => 4.3]];
        $image->save();

        $this->get("/api/v1/images/{$image->id}/area")->assertSee('4.3');
    }
}
