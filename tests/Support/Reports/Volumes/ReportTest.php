<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Volumes;

use TestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Modules\Export\Support\Reports\Volumes\Report;

class ReportTest extends TestCase
{
    public function testGetSubject()
    {
        $volume = VolumeTest::make();
        $report = new Report($volume);
        $this->assertContains($volume->name, $report->getSubject());
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
        $volume = VolumeTest::create();
        $project->addVolumeId($volume->id);

        $report = new Report($volume);

        $this->assertEquals("{$root->name} > {$child->name}", $report->expandLabelName($child->id));
    }
}
