<?php

namespace Biigle\Tests\Modules\Export;

use ModelTestCase;
use Biigle\Modules\Export\Report;

class ReportTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Report::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->user_id);
        $this->assertNotNull($this->model->type_id);
        $this->assertNotNull($this->model->source_id);
        $this->assertNotNull($this->model->source_type);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testCastsOptions()
    {
        $this->model->options = ['a' => true];
        $this->model->save();
        $this->assertEquals(['a' => true], $this->model->fresh()->options);
    }

    public function testGenerate()
    {
        $this->markTestIncomplete();
    }

    public function testGetSubject()
    {
        // For the ReportReady notification.
        $this->markTestIncomplete();
    }

    public function testGetName()
    {
        // For the ReportReady notification.
        $this->markTestIncomplete();
    }

    public function testGetUrl()
    {
        // For the ReportReady notification.
        $this->markTestIncomplete();
    }
}
