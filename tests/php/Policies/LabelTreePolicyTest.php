<?php

namespace Biigle\Tests\Policies;

use Cache;
use TestCase;
use Biigle\Role;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;

class LabelTreePolicyTest extends TestCase
{
    private $tree;
    private $user;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $this->tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $this->user = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalGuest = UserTest::create(['role_id' => Role::guestId()]);
        $this->globalEditor = UserTest::create(['role_id' => Role::editorId()]);
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
        $this->tree->addMember($this->editor, Role::editor());
        $this->tree->addMember($this->admin, Role::admin());
    }

    public function testCreate()
    {
        $this->assertFalse($this->globalGuest->can('create', LabelTree::class));
        $this->assertTrue($this->globalEditor->can('create', LabelTree::class));
        $this->assertTrue($this->globalAdmin->can('create', LabelTree::class));
    }

    public function testAccessPublic()
    {
        $this->assertTrue($this->user->can('access', $this->tree));
        $this->assertTrue($this->editor->can('access', $this->tree));
        $this->assertTrue($this->admin->can('access', $this->tree));
        $this->assertTrue($this->globalAdmin->can('access', $this->tree));
    }

    public function testAccessPrivate()
    {
        $this->tree->visibility_id = Visibility::privateId();
        $this->assertFalse($this->user->can('access', $this->tree));
        $this->assertTrue($this->editor->can('access', $this->tree));
        $this->assertTrue($this->admin->can('access', $this->tree));
        $this->assertTrue($this->globalAdmin->can('access', $this->tree));
    }

    public function testAccessViaProjectMembership()
    {
        $this->tree->visibility_id = Visibility::privateId();
        $project = ProjectTest::create();
        $this->assertFalse($project->creator->can('access', $this->tree));
        $project->labelTrees()->attach($this->tree);
        Cache::flush();
        $this->assertTrue($project->creator->can('access', $this->tree));
    }

    public function testAccessViaMasterLabelTree()
    {
        $this->tree->visibility_id = Visibility::privateId();
        $this->tree->save();
        $version = LabelTreeVersionTest::create(['label_tree_id' => $this->tree->id]);
        $tree = LabelTreeTest::create([
            'version_id' => $version->id,
            'visibility_id' => Visibility::privateId(),
        ]);
        $this->assertFalse($this->user->can('access', $tree));
        $this->assertTrue($this->editor->can('access', $tree));
        $this->assertTrue($this->admin->can('access', $tree));
        $this->assertTrue($this->globalAdmin->can('access', $tree));
    }

    public function testCreateLabel()
    {
        $this->assertFalse($this->user->can('create-label', $this->tree));
        $this->assertTrue($this->editor->can('create-label', $this->tree));
        $this->assertTrue($this->admin->can('create-label', $this->tree));
        $this->assertTrue($this->globalAdmin->can('create-label', $this->tree));
    }

    public function testCreateLabelVersionedTree()
    {
        $this->tree->version_id = LabelTreeVersionTest::create();
        $this->assertFalse($this->user->can('create-label', $this->tree));
        $this->assertFalse($this->editor->can('create-label', $this->tree));
        $this->assertFalse($this->admin->can('create-label', $this->tree));
        $this->assertFalse($this->globalAdmin->can('create-label', $this->tree));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->tree));
        $this->assertFalse($this->editor->can('update', $this->tree));
        $this->assertTrue($this->admin->can('update', $this->tree));
        $this->assertTrue($this->globalAdmin->can('update', $this->tree));
    }

    public function testUpdateVersionedTree()
    {
        $this->tree->version_id = LabelTreeVersionTest::create();
        $this->assertFalse($this->user->can('update', $this->tree));
        $this->assertFalse($this->editor->can('update', $this->tree));
        $this->assertFalse($this->admin->can('update', $this->tree));
        $this->assertFalse($this->globalAdmin->can('update', $this->tree));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->tree));
        $this->assertFalse($this->editor->can('destroy', $this->tree));
        $this->assertTrue($this->admin->can('destroy', $this->tree));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->tree));
    }

    public function testAddMember()
    {
        $this->assertFalse($this->user->can('add-member', $this->tree));
        $this->assertFalse($this->editor->can('add-member', $this->tree));
        $this->assertTrue($this->admin->can('add-member', $this->tree));
        $this->assertTrue($this->globalAdmin->can('add-member', $this->tree));
    }

    public function testAddMemberVersionedTree()
    {
        $this->tree->version_id = LabelTreeVersionTest::create();
        $this->assertFalse($this->user->can('add-member', $this->tree));
        $this->assertFalse($this->editor->can('add-member', $this->tree));
        $this->assertFalse($this->admin->can('add-member', $this->tree));
        $this->assertFalse($this->globalAdmin->can('add-member', $this->tree));
    }

    public function testUpdateMember()
    {
        $this->assertFalse($this->user->can('update-member', [$this->tree, $this->user]));

        $this->assertFalse($this->editor->can('update-member', [$this->tree, $this->user]));

        $this->assertTrue($this->admin->can('update-member', [$this->tree, $this->user]));
        $this->assertFalse($this->admin->can('update-member', [$this->tree, $this->admin]));

        $this->assertTrue($this->globalAdmin->can('update-member', [$this->tree, $this->user]));
        $this->assertTrue($this->globalAdmin->can('update-member', [$this->tree, $this->admin]));
    }

    public function testRemoveMember()
    {
        // user is no member
        $this->assertFalse($this->user->can('remove-member', [$this->tree, $this->user]));
        $this->assertFalse($this->user->can('remove-member', [$this->tree, $this->editor]));
        $this->assertFalse($this->user->can('remove-member', [$this->tree, $this->admin]));

        $this->assertFalse($this->editor->can('remove-member', [$this->tree, $this->user]));
        $this->assertTrue($this->editor->can('remove-member', [$this->tree, $this->editor]));
        $this->assertFalse($this->editor->can('remove-member', [$this->tree, $this->admin]));

        $this->assertTrue($this->admin->can('remove-member', [$this->tree, $this->user]));
        $this->assertTrue($this->admin->can('remove-member', [$this->tree, $this->editor]));
        $this->assertTrue($this->admin->can('remove-member', [$this->tree, $this->admin]));

        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->tree, $this->user]));
        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->tree, $this->editor]));
        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->tree, $this->admin]));
    }
}
