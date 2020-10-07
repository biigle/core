<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Tests\Modules\Largo\Http\Controllers\Api\LargoControllerTestBase;

class LargoControllerTest extends LargoControllerTestBase
{
    protected function getUrl()
    {
        $id = $this->project()->id;

        return "/api/v1/projects/{$id}/largo";
    }

    public function testStoreSetJobId()
    {
        $this->markTestIncomplete();
        // $this->beEditor();
        // $response = $this->post($this->url, [
        //     'dismissed' => [
        //         $this->label->label_id => [$this->annotation->id],
        //     ],
        //     'changed' => [],
        // ]);
        // $response->assertStatus(200);

        // $attrs = $this->volume()->fresh()->attrs;
        // $this->assertNotNull($attrs);
        // $this->assertArrayHasKey('largo_job_id', $attrs);
        // $this->assertStringContainsString($attrs['largo_job_id'], $response->getContent());
    }

    public function testStoreJobStillRunning()
    {
        $this->markTestIncomplete();
        // $this->volume()->attrs = ['largo_job_id' => 'my_job_id'];
        // $this->volume()->save();

        // $this->beEditor();
        // $this->postJson($this->url, [
        //     'dismissed' => [
        //         $this->label->label_id => [$this->annotation->id],
        //     ],
        //     'changed' => [],
        // ])->assertStatus(422);
    }
}
