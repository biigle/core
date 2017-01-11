<?php

namespace Biigle\Tests\Modules\Export\Support\Reports;

use Mockery;
use TestCase;
use Exception;
use Biigle\Tests\LabelTest;
use Biigle\Modules\Export\Support\Reports\Report;

class ReportTest extends TestCase
{
    public function testHandleException()
    {
        $this->setExpectedException(Exception::class);
        with(new ReportThrowExceptionStub())->generate();
    }

    public function testHandleRegular()
    {
        with(new ReportThrowNoExceptionStub())->generate();
    }

    public function testGetUrl()
    {
        $url = with(new ReportThrowNoExceptionStub())->getUrl();
        $this->assertTrue(ends_with($url, 'ab_cd_report.txt'));
    }

    public function testExpandLabelName()
    {
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $report = new Report();

        $this->assertEquals("{$root->name} > {$child->name}", $report->expandLabelName($child->id));
    }
}

class ReportThrowExceptionStub extends Report
{
    public function generateReport()
    {
        $this->availableReport = Mockery::mock();
        $this->availableReport->shouldReceive('delete')->once();

        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();

        throw new Exception;
    }
}

class ReportThrowNoExceptionStub extends Report
{
    protected $filename = 'ab_cd_report';
    protected $extension = 'txt';

    public function generateReport()
    {
        $this->availableReport = Mockery::mock();
        $this->availableReport->shouldReceive('delete')->never();

        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();
    }
}
