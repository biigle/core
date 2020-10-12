<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\MediaType;
use Biigle\Tests\Modules\Largo\Http\Controllers\Api\LargoControllerTestBase;

class LargoControllerTest extends LargoControllerTestBase
{
    public function testStoreVideoVolume()
    {
        $volume = $this->volume();
        $volume->media_type_id = MediaType::videoId();
        $volume->save();
        $this->beEditor();
        $this->postJson("/api/v1/volumes/{$volume->id}/largo")->assertStatus(422);
    }

    public function testStoreSetJobId()
    {
        $this->beEditor();
        $response = $this->post($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
        ]);
        $response->assertStatus(200);

        $attrs = $this->volume()->fresh()->attrs;
        $this->assertNotNull($attrs);
        $this->assertArrayHasKey('largo_job_id', $attrs);
        $this->assertStringContainsString($attrs['largo_job_id'], $response->getContent());
    }

    public function testStoreJobStillRunning()
    {
        $this->volume()->attrs = ['largo_job_id' => 'my_job_id'];
        $this->volume()->save();

        $this->beEditor();
        $this->postJson($this->url, [
            'dismissed' => [
                $this->label->label_id => [$this->annotation->id],
            ],
            'changed' => [],
        ])->assertStatus(422);
    }

    protected function getUrl()
    {
        $id = $this->volume()->id;

        return "/api/v1/volumes/{$id}/largo";
    }
}
