<?php

namespace Biigle\Tests;

use Biigle\Jobs\DeleteVolume;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Project;
use Biigle\ProjectInvitation;
use Biigle\Role;
use Illuminate\Database\QueryException;
use ModelTestCase;
use Queue;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProjectTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Project::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->creator_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testHiddenAttributes()
    {
        $jsonProject = json_decode((string) $this->model);
        $this->assertObjectNotHasProperty('pivot', $jsonProject);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testDescriptionRequired()
    {
        $this->model->description = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testCreatorNullable()
    {
        $this->model->creator()->dissociate();
        $this->model->save();
        $this->assertEquals(null, $this->model->creator_id);
    }

    public function testCreatorOnDeleteSetNull()
    {
        $this->model->creator()->delete();
        $this->assertEquals(null, $this->model->fresh()->creator);
    }

    public function testCreator()
    {
        // creator will be user as well
        $this->assertEquals($this->model->creator->id, $this->model->users()->first()->id);
    }

    public function testUsers()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::adminId());

        $this->assertNotNull($this->model->users()->find($user->id));
    }

    public function testAdmins()
    {
        $admin = UserTest::create();
        $member = UserTest::create();
        $this->model->addUserId($admin->id, Role::adminId());
        $this->model->addUserId($member->id, Role::editorId());
        // the creator doesn't count
        $this->model->creator->delete();

        $this->assertEquals(2, $this->model->users()->count());
        $this->assertEquals(1, $this->model->admins()->count());
    }

    public function testEditors()
    {
        $editor = UserTest::create();
        $member = UserTest::create();
        $this->model->addUserId($editor->id, Role::editorId());
        $this->model->addUserId($member->id, Role::guestId());

        // count the project creator, too
        $this->assertEquals(3, $this->model->users()->count());
        $this->assertEquals(1, $this->model->editors()->count());
    }

    public function testGuests()
    {
        $member = UserTest::create();
        $this->model->addUserId($member->id, Role::guestId());

        // count the project creator, too
        $this->assertEquals(2, $this->model->users()->count());
        $this->assertEquals(1, $this->model->guests()->count());
    }

    public function testVolumes()
    {
        $volume = VolumeTest::make();
        $this->model->volumes()->save($volume);
        $this->assertEquals($volume->id, $this->model->volumes()->first()->id);
        $this->assertEquals(1, $this->model->volumes()->count());
    }

    public function testAddUserId()
    {
        $user = UserTest::create();
        $this->assertNull($this->model->users()->find($user->id));

        $this->model->addUserId($user->id, Role::editorId());
        $user = $this->model->users()->find($user->id);
        $this->assertNotNull($user);
        $this->assertEquals(Role::editorId(), $user->project_role_id);

        // a user can only be added once regardless the role
        $this->expectException(QueryException::class);
        $this->model->addUserId($user->id, Role::adminId());
    }

    public function testRemoveUserId()
    {
        $admin = UserTest::create();
        $this->model->addUserId($admin->id, Role::adminId());
        $this->assertNotNull($this->model->users()->find($admin->id));
        $this->assertTrue($this->model->removeUserId($admin->id));
        $this->assertNull($this->model->users()->find($admin->id));
        $this->assertFalse($this->model->removeUserId($this->model->creator->id));
    }

    public function testCheckUserCanBeRemoved()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::editorId());
        $this->assertTrue($this->model->userCanBeRemoved($user->id));
        $this->assertFalse($this->model->userCanBeRemoved($this->model->creator->id));
    }

    public function testChangeRole()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::adminId());
        $this->assertEquals(Role::adminId(), $this->model->users()->find($user->id)->project_role_id);
        $this->model->changeRole($user->id, Role::editorId());
        $this->assertEquals(Role::editorId(), $this->model->users()->find($user->id)->project_role_id);
    }

    public function testRemoveVolume()
    {
        $secondProject = self::create();
        $secondProject->save();
        $volume = VolumeTest::create();
        $this->model->volumes()->attach($volume);
        $secondProject->volumes()->attach($volume);

        $this->assertNotEmpty($secondProject->fresh()->volumes);
        $secondProject->removeVolume($volume);
        $this->assertEmpty($secondProject->fresh()->volumes);

        try {
            // trying to detach a volume belonging to only one project fails
            // without force
            $this->model->removeVolume($volume);
            $this->assertFalse(true);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        // use the force to detach and delete the volume
        Queue::fake();
        $this->model->removeVolume($volume, true);
        Queue::assertPushed(DeleteVolume::class, fn ($job) => $volume->id === $job->volume->id);
        $this->assertFalse($this->model->volumes()->exists());
    }

    public function testRemoveAllVolumes()
    {
        $secondProject = self::create();
        $secondProject->save();
        $volume = VolumeTest::create();
        $this->model->volumes()->attach($volume);
        $secondProject->volumes()->attach($volume);

        $this->assertNotEmpty($secondProject->fresh()->volumes);
        $secondProject->removeAllVolumes();
        $this->assertEmpty($secondProject->fresh()->volumes);

        try {
            // trying to detach a volume belonging to only one project fails
            // without force
            $this->model->removeAllVolumes();
            $this->assertFalse(true);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        // use the force to detach and delete the volume
        Queue::fake();
        $this->model->removeAllVolumes(true);
        Queue::assertPushed(DeleteVolume::class, fn ($job) => $volume->id === $job->volume->id);
        $this->assertFalse($this->model->volumes()->exists());
    }

    public function testLabelTrees()
    {
        $count = $this->model->labelTrees()->count();
        LabelTreeTest::create()->projects()->attach($this->model->id);
        $this->assertEquals($count + 1, $this->model->labelTrees()->count());
    }

    public function testAuthorizedLabelTrees()
    {
        $this->assertFalse($this->model->authorizedLabelTrees()->exists());
        LabelTreeTest::create()->authorizedProjects()->attach($this->model->id);
        $this->assertTrue($this->model->authorizedLabelTrees()->exists());
    }

    public function testDefaultLabelTrees()
    {
        // tree has no members so it is global
        $tree = LabelTreeTest::create();
        $project = self::create();
        $this->assertTrue($project->labelTrees()->exists());
        $this->assertTrue($project->labelTrees()->where('id', $tree->id)->exists());
    }

    public function testDefaultLabelTreesWithoutVersions()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $project = self::create();
        $ids = $project->labelTrees()->pluck('id')->all();
        $this->assertEquals([$version->labelTree->id], $ids);
    }

    public function testGetThumbnailUrlAttributeNull()
    {
        $this->assertEquals(null, $this->model->thumbnailUrl);
    }

    public function testGetThumbnailUrlAttributeImage()
    {
        $i1 = ImageTest::create();
        $i2 = ImageTest::create();
        $this->model->addVolumeId($i1->volume_id);
        $this->model->addVolumeId($i2->volume_id);

        $this->assertStringContainsString($i1->uuid, $this->model->thumbnailUrl);
    }

    public function testGetThumbnailUrlAttributeVideo()
    {
        $v1 = VideoTest::create();
        $v2 = VideoTest::create();
        $this->model->addVolumeId($v1->volume_id);
        $this->model->addVolumeId($v2->volume_id);

        $this->assertStringContainsString($v1->uuid, $this->model->thumbnailUrl);
    }

    public function testHasGeoInfo()
    {
        $this->assertFalse($this->model->hasGeoInfo());
        $v = VolumeTest::create();
        $this->model->volumes()->attach($v);
        ImageTest::create([
            'lng' => 5.5,
            'lat' => 5.5,
            'volume_id' => $v->id,
        ]);
        $this->assertFalse($this->model->hasGeoInfo());
        $this->model->flushGeoInfoCache();
        $this->assertTrue($this->model->hasGeoInfo());
    }

    public function testScopeInCommon()
    {
        $v = VolumeTest::create();
        $user = UserTest::create();
        $this->model->volumes()->attach($v);
        $this->model->addUserId($user->id, Role::guestId());
        $p = self::create();
        $p->volumes()->attach($v);

        $projects = Project::inCommon($user, $v->id)->pluck('id');
        $this->assertEquals(1, $projects->count());
        $this->assertEquals($this->model->id, $projects[0]);

        $projects = Project::inCommon($user, $v->id, [Role::adminId()])->pluck('id');
        $this->assertEmpty($projects);
    }

    public function testImageVolumes()
    {
        $v = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $this->model->addVolumeId($v->id);
        $this->assertEquals(0, $this->model->imageVolumes()->count());
        $v = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $this->model->addVolumeId($v->id);
        $this->assertEquals(1, $this->model->imageVolumes()->count());
    }

    public function testVideoVolumes()
    {
        $v = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $this->model->addVolumeId($v->id);
        $this->assertEquals(0, $this->model->videoVolumes()->count());
        $v = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $this->model->addVolumeId($v->id);
        $this->assertEquals(1, $this->model->videoVolumes()->count());
    }

    public function testScopeAccessibleBy()
    {
        $user = UserTest::create();
        $this->assertFalse(Project::accessibleBy($user)->exists());
        $this->model->addUserId($user->id, Role::guestId());
        $this->assertTrue(Project::accessibleBy($user)->exists());
    }

    public function testInvitations()
    {
        $this->assertFalse($this->model->invitations()->exists());
        ProjectInvitation::factory(['project_id' => $this->model->id])->create();
        $this->assertTrue($this->model->invitations()->exists());
    }

    public function testPendingVolumes()
    {
        $this->assertFalse($this->model->pendingVolumes()->exists());
        PendingVolume::factory(['project_id' => $this->model->id])->create();
        $this->assertTrue($this->model->pendingVolumes()->exists());
    }
}
