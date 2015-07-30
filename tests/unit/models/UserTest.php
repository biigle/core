<?php

use Dias\User;
use Dias\Role;

class UserTest extends ModelWithAttributesTest
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\User::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->firstname);
        $this->assertNotNull($this->model->lastname);
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->password);
        $this->assertNotNull($this->model->email);
        $this->assertNotNull($this->model->role_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testFirstnameRequired()
    {
        $this->model->firstname = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testLastnameRequired()
    {
        $this->model->lastname = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testPasswordRequired()
    {
        $this->model->password = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testEmailRequired()
    {
        $this->model->email = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testEmailUnique()
    {
        self::create(['email' => 'test@test.com']);
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create(['email' => 'test@test.com']);
    }

    public function testProjects()
    {
        $project = ProjectTest::create();
        $role = RoleTest::create();
        $project->addUserId($this->model->id, $role->id);

        $this->assertEquals($this->model->projects()->first()->id, $project->id);
    }

    public function testRole()
    {
        $this->assertEquals(Role::editorId(), $this->model->role->id);
    }

    public function testIsAdmin()
    {
        $this->assertFalse($this->model->isAdmin);
        $this->model->role()->associate(Role::admin());
        $this->assertTrue($this->model->isAdmin);
    }

    public function testHiddenAttributes()
    {
        // API key mustn't show up in the JSON
        $this->model->generateAPIKey();
        $jsonUser = json_decode((string) $this->model);
        $this->assertObjectNotHasAttribute('firstname', $jsonUser);
        $this->assertObjectNotHasAttribute('lastname', $jsonUser);
        $this->assertObjectNotHasAttribute('password', $jsonUser);
        $this->assertObjectNotHasAttribute('email', $jsonUser);
        $this->assertObjectNotHasAttribute('remember_token', $jsonUser);
        $this->assertObjectNotHasAttribute('created_at', $jsonUser);
        $this->assertObjectNotHasAttribute('updated_at', $jsonUser);
        $this->assertObjectNotHasAttribute('login_at', $jsonUser);
        $this->assertObjectNotHasAttribute('api_key', $jsonUser);
    }

    public function testApiKey()
    {
        $this->assertNull($this->model->api_key);
        $key = $this->model->generateApiKey();
        $this->assertNotNull($this->model->api_key);
    }

    public function testCanSeeOneOfProjects()
    {
        $project = ProjectTest::create();
        $projectIds = [$project->id];
        $this->assertFalse($this->model->canSeeOneOfProjects($projectIds));
        $project->addUserId($this->model->id, Role::guestId());
        Cache::flush();
        $this->assertTrue($this->model->canSeeOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::editorId());
        Cache::flush();
        $this->assertTrue($this->model->canSeeOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::adminId());
        Cache::flush();
        $this->assertTrue($this->model->canSeeOneOfProjects($projectIds));
    }

    public function testCanEditInOneOfProjects()
    {
        $project = ProjectTest::create();
        $projectIds = [$project->id];
        $this->assertFalse($this->model->canEditInOneOfProjects($projectIds));
        $project->addUserId($this->model->id, Role::guestId());
        Cache::flush();
        $this->assertFalse($this->model->canEditInOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::editorId());
        Cache::flush();
        $this->assertTrue($this->model->canEditInOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::adminId());
        Cache::flush();
        $this->assertTrue($this->model->canEditInOneOfProjects($projectIds));
    }

    public function testCanAdminOneOfProjects()
    {
        $project = ProjectTest::create();
        $projectIds = [$project->id];
        $this->assertFalse($this->model->canAdminOneOfProjects($projectIds));
        $project->addUserId($this->model->id, Role::guestId());
        Cache::flush();
        $this->assertFalse($this->model->canAdminOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::editorId());
        Cache::flush();
        $this->assertFalse($this->model->canAdminOneOfProjects($projectIds));
        $project->changeRole($this->model->id, Role::adminId());
        Cache::flush();
        $this->assertTrue($this->model->canAdminOneOfProjects($projectIds));
    }
}
