<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes;

use App;
use File;
use Mockery;
use TestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Modules\Reports\Support\Exec;
use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;

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

        $this->assertEquals("{$root->name} > {$child->name}", $generator->expandLabelName($child->id));
    }
}
