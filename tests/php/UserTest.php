<?php

namespace Biigle\Tests;

use Biigle\Role;
use Biigle\User;
use Illuminate\Database\QueryException;
use ModelTestCase;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = User::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->firstname);
        $this->assertNotNull($this->model->lastname);
        $this->assertNotNull($this->model->password);
        $this->assertNotNull($this->model->email);
        $this->assertNotNull($this->model->role_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->uuid);
        $this->assertNotNull($this->model->affiliation);
    }

    public function testEmailToLowercase()
    {
        $this->model->email = 'Test@Example.com';
        $this->model->save();
        $this->assertEquals('test@example.com', $this->model->fresh()->email);
    }

    public function testCastsLoginAt()
    {
        $this->be($this->model);
        // make sure the login_at attribute is populated
        $response = $this->get('/');
        $this->assertTrue($this->model->login_at instanceof \Carbon\Carbon);
    }

    public function testFirstnameRequired()
    {
        $this->model->firstname = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testLastnameRequired()
    {
        $this->model->lastname = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testPasswordRequired()
    {
        $this->model->password = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testEmailRequired()
    {
        $this->model->email = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testEmailUnique()
    {
        self::create(['email' => 'test@test.com']);
        $this->expectException(QueryException::class);
        self::create(['email' => 'test@test.com']);
    }

    public function testUuidRequired()
    {
        $this->model->uuid = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testUuidUnique()
    {
        self::create(['uuid' => 'c796ccec-c746-308f-8009-9f1f68e2aa62']);
        $this->expectException(QueryException::class);
        self::create(['uuid' => 'c796ccec-c746-308f-8009-9f1f68e2aa62']);
    }

    public function testProjects()
    {
        $project = ProjectTest::create();
        $role = RoleTest::create();
        $project->addUserId($this->model->id, $role->id);

        $p = $this->model->projects()->first();
        $this->assertEquals($project->id, $p->id);
        $this->assertFalse($p->pivot->pinned);
    }

    public function testLabelTrees()
    {
        $this->assertFalse($this->model->labelTrees()->exists());
        LabelTreeTest::create()->addMember($this->model, Role::editor());
        $this->assertTrue($this->model->labelTrees()->exists());
    }

    public function testRole()
    {
        $this->assertEquals(Role::editorId(), $this->model->role->id);
    }

    public function testIsGlobalAdminAttribute()
    {
        $this->assertFalse($this->model->isGlobalAdmin);
        $this->model->role()->associate(Role::admin());
        $this->assertTrue($this->model->isGlobalAdmin);
    }

    public function testHiddenAttributes()
    {
        // API tokens mustn't show up in the JSON
        ApiTokenTest::create(['owner_id' => $this->model->id]);
        $jsonUser = json_decode((string) $this->model->fresh());
        $this->assertObjectNotHasProperty('password', $jsonUser);
        $this->assertObjectNotHasProperty('remember_token', $jsonUser);
        $this->assertObjectNotHasProperty('api_tokens', $jsonUser);
    }

    public function testApiTokens()
    {
        $this->assertEmpty($this->model->apiTokens()->get());
        ApiTokenTest::create(['owner_id' => $this->model->id]);
        $this->assertNotEmpty($this->model->apiTokens()->get());
    }

    public function testCheckCanBeDeletedProjects()
    {
        $project = ProjectTest::create();
        $project->addUserId($this->model->id, Role::guestId());

        $this->model->checkCanBeDeleted();
        $this->expectException(HttpException::class);
        $project->creator->checkCanBeDeleted();
    }

    public function testCheckCanBeDeletedLabelTrees()
    {
        $tree = LabelTreeTest::create();
        $editor = self::create();
        $tree->addMember($editor, Role::editor());
        $tree->addMember($this->model, Role::admin());

        $editor->checkCanBeDeleted();
        $this->expectException(HttpException::class);
        $this->model->checkCanBeDeleted();
    }

    public function testCastSettings()
    {
        $user = self::create(['attrs' => ['settings' => ['abc' => 'def']]]);
        $this->assertEquals(['abc' => 'def'], $user->fresh()->settings);
    }

    public function testSetSettings()
    {
        $this->model->setSettings(['a' => true]);
        $this->model->save();
        $this->assertEquals(['a' => true], $this->model->fresh()->settings);

        $this->model->setSettings(['b' => 20]);
        $this->model->save();
        $this->assertEquals(['a' => true, 'b' => 20], $this->model->fresh()->settings);

        $this->model->setSettings(['a' => null, 'b' => 10]);
        $this->model->save();
        $this->assertEquals(['b' => 10], $this->model->fresh()->settings);

        $this->model->setSettings(['a' => null, 'b' => null]);
        $this->model->save();
        $this->assertNull($this->model->fresh()->settings);
    }

    public function testGetSettings()
    {
        $this->assertNull($this->model->getSettings('mysetting'));
        $this->assertEquals('a', $this->model->getSettings('mysetting', 'a'));
        $this->model->setSettings(['mysetting' => 'b']);
        $this->assertEquals('b', $this->model->getSettings('mysetting', 'a'));
    }

    public function testGetIsInSuperUserModeAttribute()
    {
        $this->assertFalse($this->model->isInSuperUserMode);
        $this->model->role_id = Role::adminId();
        $this->model->save();
        $this->assertTrue($this->model->isInSuperUserMode);
        $this->model->setSettings(['super_user_mode' => false]);
        $this->assertFalse($this->model->isInSuperUserMode);
        $this->model->setSettings(['super_user_mode' => true]);
        $this->assertTrue($this->model->isInSuperUserMode);
    }

    public function testSetIsInSuperUserModeAttribute()
    {
        $this->model->isInSuperUserMode = true;
        $this->assertFalse($this->model->isInSuperUserMode);
        $this->model->role_id = Role::adminId();
        $this->model->save();
        $this->model->isInSuperUserMode = true;
        $this->assertTrue($this->model->isInSuperUserMode);
        $this->model->isInSuperUserMode = false;
        $this->assertFalse($this->model->isInSuperUserMode);
    }

    public function testSudoAbility()
    {
        $this->assertFalse($this->model->can('sudo'));
        $this->model->role_id = Role::adminId();
        $this->model->save();
        $this->assertTrue($this->model->can('sudo'));
        $this->model->isInSuperUserMode = false;
        $this->assertFalse($this->model->can('sudo'));
    }

    public function testCanReviewAttribute()
    {
        $this->model->role_id = Role::guestId();
        $this->assertFalse($this->model->canReview);
        $this->model->canReview = true;
        $this->assertFalse($this->model->canReview);

        $this->model->role_id = Role::editorId();
        $this->assertTrue($this->model->canReview);
        $this->assertNotNull($this->model->attrs);
        $this->model->canReview = false;
        $this->assertFalse($this->model->canReview);
        $this->assertNull($this->model->attrs);

        $this->model->role_id = Role::adminId();
        $this->model->canReview = false;
        $this->assertTrue($this->model->canReview);
        $this->model->isInSuperUserMode = false;
        $this->assertFalse($this->model->canReview);
    }

    public function testReviewAbility()
    {
        $this->assertFalse($this->model->can('review'));
        $this->model->canReview = true;
        $this->model->save();
        $this->assertTrue($this->model->can('review'));
        $this->model->canReview = false;
        $this->model->role_id = Role::adminId();
        $this->model->save();
        $this->assertTrue($this->model->can('review'));
        $this->model->isInSuperUserMode = false;
        $this->model->save();
        $this->assertFalse($this->model->can('review'));
    }

    public function testFederatedSearchModels()
    {
        $model = FederatedSearchModelTest::create();
        $this->assertFalse($this->model->federatedSearchModels()->exists());
        $model->users()->attach($this->model);
        $this->assertTrue($this->model->federatedSearchModels()->exists());
    }
}
