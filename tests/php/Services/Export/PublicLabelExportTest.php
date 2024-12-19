<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Services\Export\PublicLabelExport;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\LabelTest;
use File;
use SplFileObject;
use TestCase;

class PublicLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $parent = LabelTest::create(['source_id' => 'abcdef']);
        $child = LabelTest::create([
            'label_tree_id' => $parent->label_tree_id,
            'parent_id' => $parent->id,
        ]);
        $export = new PublicLabelExport([$parent->label_tree_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expectParent = [
            "{$parent->id}",
            "{$parent->name}",
            "{$parent->parent_id}",
            "{$parent->color}",
            "{$parent->label_tree_id}",
            "{$parent->source_id}",
        ];
        $this->assertEquals($expectParent, $file->fgetcsv());

        $expectChild = [
            "{$child->id}",
            "{$child->name}",
            "{$child->parent_id}",
            "{$child->color}",
            "{$child->label_tree_id}",
            "{$child->source_id}",
        ];
        $this->assertEquals($expectChild, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $parent = LabelTest::create();
        $export = new PublicLabelExport([$parent->label_tree_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
