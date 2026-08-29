<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Role;
use Biigle\Services\Export\LabelTreeExport;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\UserTest;
use TestCase;

class LabelTreeExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = LabelTest::create();
        $tree = $label->tree;
        $user1 = UserTest::create();
        $user2 = UserTest::create();
        $tree->addMember($user1, Role::admin());

        $export = new LabelTreeExport([$tree->id]);
        $expect = [[
            'id' => $tree->id,
            'name' => $tree->name,
            'description' => $tree->description,
            'uuid' => $tree->uuid,
            'version' => null,
            'labels' => [[
                'id' => $label->id,
                'name' => $label->name,
                'color' => $label->color,
                'parent_id' => $label->parent_id,
                'uuid' => $label->uuid,
            ]],
            'members' => [[
                'id' => $user1->id,
                'role_id' => Role::adminId(),
            ]],
        ]];

        $this->assertEquals($expect, $export->getContent());
    }

    public function testGetContentVersion()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);

        $export = new LabelTreeExport([$tree->id]);
        $expect = [
            [
                'id' => $version->labelTree->id,
                'name' => $version->labelTree->name,
                'description' => $version->labelTree->description,
                'uuid' => $version->labelTree->uuid,
                'labels' => [],
                'version' => null,
                'members' => [],
            ],
            [
                'id' => $tree->id,
                'name' => $tree->name,
                'description' => $tree->description,
                'uuid' => $tree->uuid,
                'labels' => [],
                'version' => [
                    'id' => $version->id,
                    'name' => $version->name,
                    'label_tree_id' => $version->label_tree_id,
                    'doi' => $version->doi,
                ],
                'members' => [],
            ],
        ];

        $content = $export->getContent();
        $this->assertContains($expect[0], $content);
        $this->assertContains($expect[1], $content);
    }

    public function testGetAdditionalExports()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::admin());
        $exports = (new LabelTreeExport([$tree->id]))->getAdditionalExports();

        $this->assertCount(1, $exports);
        $content = $exports[0]->getContent();
        $this->assertEquals($user->uuid, $content[0]['uuid']);
    }

    public function testGetAdditionalExportsVersion()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $user = UserTest::create();
        $version->labelTree->addMember($user, Role::admin());
        $exports = (new LabelTreeExport([$tree->id]))->getAdditionalExports();

        $this->assertCount(1, $exports);
        $content = $exports[0]->getContent();
        $this->assertEquals($user->uuid, $content[0]['uuid']);
    }
}
