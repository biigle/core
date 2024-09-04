<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes;

use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class VolumeReportGeneratorTest extends TestCase
{
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

        $generator = new VolumeReportGenerator;
        $generator->setSource($volume);

        $this->assertSame("{$root->name} > {$child->name}", $generator->expandLabelName($child->id));
    }
}
