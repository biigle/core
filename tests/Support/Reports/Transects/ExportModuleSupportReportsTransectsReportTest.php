<?php

use Dias\Modules\Export\Support\Reports\Transects\Report;

class ExportModuleSupportReportsTransectsReportTest extends TestCase
{
    public function testGetSubject()
    {
        $transect = TransectTest::make();
        $report = new Report($transect);
        $this->assertContains($transect->name, $report->getSubject());
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
        $transect = TransectTest::create();
        $project->addTransectId($transect->id);

        $report = new Report($transect);

        $this->assertEquals("{$root->name} > {$child->name}", $report->expandLabelName($child->id));
    }
}
