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

    public function testExpandLabelNameOwnTree()
    {
        $project = ProjectTest::create();
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);
        $project->labelTrees()->attach($root->tree);

        $report = new Report($project);

        $this->assertEquals("{$root->name} > {$child->name}", $report->expandLabelName($child->id));
    }

    public function testExpandLabelNameOtherTree()
    {
        $project = ProjectTest::create();
        // these labels do NOT belong to a label tree attached to the project
        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $report = new Report($project);

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
    public function __construct($project)
    {
        parent::__construct($project);
        $this->filename = 'ab_cd_report';
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
