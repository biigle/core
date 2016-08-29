<?php

use Dias\Modules\Export\Support\Reports\Report;

class ExportModuleSupportReportsReportTest extends TestCase {

    public function testHandleException()
    {
        $project = ProjectTest::make();
        $this->setExpectedException(Exception::class);
        with(new ReportThrowExceptionStub($project))->generate();
    }

    public function testHandleRegular()
    {
        $project = ProjectTest::make();
        with(new ReportThrowNoExceptionStub($project))->generate();
    }

    public function testGetUrl()
    {
        $project = ProjectTest::make();
        $url = with(new ReportThrowNoExceptionStub($project))->getUrl();
        $this->assertTrue(ends_with($url, 'ab_cd_report.txt'));
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
    public function __construct($project)
    {
        parent::__construct($project);
        $this->filename = 'ab_cd';
        $this->extension = 'txt';
    }

    public function generateReport()
    {
        $this->availableReport = Mockery::mock();
        $this->availableReport->shouldReceive('delete')->never();

        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();
    }
}
