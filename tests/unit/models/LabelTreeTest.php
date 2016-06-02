<?php

use Dias\Role;
use Dias\Visibility;
use Dias\LabelTree;

class LabelTreeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\LabelTree::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testVisibilityOnDeleteRestrict()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->visibility()->delete();
    }

    public function testMembers()
    {
        $user = UserTest::create();
        $this->model->members()->attach($user->id, ['role_id' => Role::$admin->id]);
        $this->assertNotNull($this->model->members()->find($user->id));
    }

    public function testLabels()
    {
        $this->assertFalse($this->model->labels()->exists());
        LabelTest::create(['label_tree_id' => $this->model->id]);
        $this->assertTrue($this->model->labels()->exists());
    }

    public function testCanBeDeleted()
    {
        $this->assertTrue($this->model->canBeDeleted());
        $label = LabelTest::create(['label_tree_id' => $this->model->id]);
        $this->assertTrue($this->model->canBeDeleted());
        AnnotationLabelTest::create(['label_id' => $label->id]);
        $this->assertFalse($this->model->canBeDeleted());
    }

    public function testAddAdmin()
    {
        $this->assertFalse($this->model->members()->exists());
        $this->model->addMember(UserTest::create(), Role::$admin);
        $this->assertEquals(Role::$admin->id, $this->model->members()->first()->role_id);
    }

    public function testAddEditor()
    {
        $this->assertFalse($this->model->members()->exists());
        $this->model->addMember(UserTest::create(), Role::$editor);
        $this->assertEquals(Role::$editor->id, $this->model->members()->first()->role_id);
    }

    public function testAddGuest()
    {
        $this->assertFalse($this->model->members()->exists());
        // label trees can't have guests
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->addMember(UserTest::create(), Role::$guest);
    }

    public function testAddMemberUserExists()
    {
        $user = UserTest::create();
        $this->model->addMember($user, Role::$admin);
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->addMember($user, Role::$admin);
    }

    public function testMemberCanBeRemoved()
    {
        $user = UserTest::create();
        $this->model->addMember($user, Role::$admin);
        $this->assertFalse($this->model->memberCanBeRemoved($user));
        $this->model->addMember(UserTest::create(), Role::$editor);
        $this->assertFalse($this->model->memberCanBeRemoved($user));
        $this->model->addMember(UserTest::create(), Role::$admin);
        $this->assertTrue($this->model->memberCanBeRemoved($user));
    }

    public function testProjects()
    {
        $project = ProjectTest::create();
        $this->model->projects()->attach($project->id);
        $this->assertNotNull($this->model->projects()->find($project->id));
    }

    public function testAuthorizedProjects()
    {
        $project = ProjectTest::create();
        $this->model->authorizedProjects()->attach($project->id);
        $this->assertNotNull($this->model->authorizedProjects()->find($project->id));
    }

    public function testPublicScope()
    {
        $public = static::create(['visibility_id' => Visibility::$public->id]);
        $private = static::create(['visibility_id' => Visibility::$private->id]);

        $ids = LabelTree::public()->pluck('id');
        $this->assertContains($public->id, $ids);
        $this->assertNotContains($private->id, $ids);
    }

    public function testPrivateScope()
    {
        $public = static::create(['visibility_id' => Visibility::$public->id]);
        $private = static::create(['visibility_id' => Visibility::$private->id]);

        $ids = LabelTree::private()->pluck('id');
        $this->assertContains($private->id, $ids);
        $this->assertNotContains($public->id, $ids);
    }
}
