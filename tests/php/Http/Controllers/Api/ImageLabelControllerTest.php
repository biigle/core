<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;

class ImageLabelControllerTest extends ApiTestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create(['volume_id' => $this->volume()->id]);
    }

    public function testDestroy()
    {
        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
            'project_volume_id' => $this->projectVolume()->id,
        ])->id;

        $id2 = ImageLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->admin()->id,
            'project_volume_id' => $this->projectVolume()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', '/api/v1/image-labels/'.$id);

        $this->beUser();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id)->exists());
        $this->beEditor();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/image-labels/'.$id2);
        // not the own label
        $response->assertStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id2)->exists());

        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
            'project_volume_id' => $this->projectVolume()->id,
        ])->id;
        $this->assertTrue($this->image->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/image-labels/'.$id2);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->exists());
    }
}
