<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;

class LabelTreeExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = LabelTest::create();
        $tree = $label->tree;
        $user1 = UserTest::create();
        $user2 = UserTest::create();
        $tree->addMember($user1, Role::$admin);

        $export = new LabelTreeExport([$tree->id]);
        $expect = [
            'users' => [[
                'id' => $user1->id,
                'firstname' => $user1->firstname,
                'lastname' => $user1->lastname,
                'password' => $user1->password,
                'email' => $user1->email,
                'settings' => $user1->settings,
                'uuid' => $user1->uuid,
            ]],
            'label-trees' => [[
                'id' => $tree->id,
                'name' => $tree->name,
                'description' => $tree->description,
                'uuid' => $tree->uuid,
                'labels' => [[
                    'id' => $label->id,
                    'name' => $label->name,
                    'color' => $label->color,
                    'parent_id' => $label->parent_id,
                    'uuid' => $label->uuid,
                    'source_id' => $label->source_id,
                    'label_source_id' => $label->label_source_id,
                ]],
                'members' => [[
                    'id' => $user1->id,
                    'role_id' => Role::$admin->id,
                ]],
            ]],
        ];

        $this->assertEquals($expect, $export->getContent());
    }
}
