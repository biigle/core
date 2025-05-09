<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Role;
use Biigle\Services\Export\PublicLabelTreeExport;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\UserTest;
use SplFileObject;
use TestCase;

class PublicLabelTreeExportTest extends TestCase
{
    public function testGetContent()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::admin());

        $export = new PublicLabelTreeExport([$tree->id]);
        $expect = [
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'uuid' => $tree->uuid,
            'version' => null,
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
        ];

        $this->assertEquals($expect, $export->getContent());
    }

    public function testGetContentVersion()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $user = UserTest::create();
        $tree->addMember($user, Role::admin());

        $export = new PublicLabelTreeExport([$tree->id]);
        $expect = [
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'uuid' => $tree->uuid,
            'version' => [
                'id' => $version->id,
                'name' => $version->name,
                'doi' => $version->doi,
            ],
            'created_at' => $tree->created_at->toJson(),
            'updated_at' => $tree->updated_at->toJson(),
        ];

        $this->assertEquals($expect, $export->getContent());
    }

    public function testGetAdditionalExports()
    {
        $tree = LabelTreeTest::create();
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        $exports = (new PublicLabelTreeExport([$tree->id]))->getAdditionalExports();
        $this->assertCount(1, $exports);
        $path = $exports[0]->getContent();

        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$label->id}",
            "{$label->name}",
            "{$label->parent_id}",
            "{$label->color}",
            "{$label->label_tree_id}",
            "{$label->source_id}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }
}
