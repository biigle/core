<?php

use Dias\Project;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Annotations\Basic;
use Dias\Modules\Export\Jobs\Annotations\GenerateBasicReport;

class ExportModuleJobsGenerateReportTest extends TestCase {

    public function testHandleException()
    {
        $project = ProjectTest::make();
        $user = UserTest::make();
        $this->setExpectedException(Exception::class);
        with(new ReportJobThrowExceptionStub($project, $user))->handle();
    }

    public function testHandleRegular()
    {
        $project = ProjectTest::make();
        $user = UserTest::make();
        with(new ReportJobThrowNoExceptionStub($project, $user))->handle();
    }
}

class ReportJobThrowExceptionStub extends GenerateReportJob
{
    public function generateReport()
    {
        $this->report = Mockery::mock();
        $this->report->shouldReceive('delete')->once();

        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();

        throw new Exception();
    }
}

class ReportJobThrowNoExceptionStub extends GenerateReportJob
{
    public function generateReport()
    {
        $this->report = Mockery::mock();
        $this->report->shouldReceive('delete')->never();

        $this->tmpFiles[] = Mockery::mock();
        $this->tmpFiles[0]->shouldReceive('delete')->once();
    }
}
