<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use TestCase;
use Biigle\Role;
use SplFileObject;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Modules\Sync\Support\Export\PublicLabelTreeExport;

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
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
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
            ],
            'created_at' => (string) $tree->created_at,
            'updated_at' => (string) $tree->updated_at,
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
            "{$label->label_source_id}",
            "{$label->uuid}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }
}
