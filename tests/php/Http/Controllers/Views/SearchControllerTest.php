<?php

namespace Biigle\Tests\Http\Controllers\Views;

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\ReportType;
use Biigle\Role;
use Biigle\Tests\FederatedSearchModelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\ReportTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Visibility;
use Biigle\Volume;
use TestCase;

class SearchControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('search')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $this->actingAs(UserTest::create())->get('search')->assertViewIs('search.index');
    }

    public function testIndexLabelTrees()
    {
        $user = UserTest::create();
        $tree = LabelTreeTest::create(['name' => 'random name']);
        $tree2 = LabelTreeTest::create(['name' => 'another tree']);
        $tree3 = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::privateId(),
        ]);
        $tree->addMember($user, Role::editor());

        $this->be($user);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertSeeText('random name')
            ->assertSeeText('another tree')
            ->assertDontSeeText('private one');

        $this->get('search?t=label-trees&q=name')
            ->assertStatus(200)
            ->assertSeeText('random name')
            ->assertDontSeeText('another tree')
            ->assertDontSeeText('private one');
    }

    public function testIndexLabelTreesAccessViaProject()
    {
        $tree = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::privateId(),
        ]);

        $project = ProjectTest::create();

        $this->be($project->creator);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('private one');

        $project->labelTrees()->attach($tree);

        $this->get('search?t=label-trees')->assertSeeText('private one');
    }

    public function testIndexLabelTreesHideVersions()
    {
        $user = UserTest::create();
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create([
            'name' => 'random name',
            'version_id' => $version->id,
        ]);

        $this->be($user);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('random name');
    }

    public function testIndexLabelTreesFederatedSearch()
    {
        $model = FederatedSearchModelTest::create([
            'name' => 'my remote label tree',
            'type' => LabelTree::class,
        ]);

        $user = UserTest::create();
        $user->federatedSearchModels()->attach($model);
        $this->be($user);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertSeeText('my remote label tree');

        $this->get('search?t=label-trees&q=xyz')
            ->assertStatus(200)
            ->assertDontSeeText('my remote label tree');

        $user->setSettings(['include_federated_search' => false]);
        $this->get('search?t=label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('my remote label tree');
    }

    public function testIndexProjects()
    {
        $user = UserTest::create();
        $project = ProjectTest::create(['name' => 'random name']);
        $project2 = ProjectTest::create(['name' => 'another project']);
        $project3 = ProjectTest::create(['name' => 'and again']);
        $project->addUserId($user->id, Role::guestId());
        $project2->addUserId($user->id, Role::adminId());

        $this->be($user);
        $response = $this->get('search')->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertSeeText('another project');
        $response->assertDontSeeText('and again');

        $response = $this->get('search?t=projects')->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertSeeText('another project');
        $response->assertDontSeeText('and again');

        $response = $this->get('search?q=name')->assertStatus(200);
        $response->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertDontSeeText('another project');
        $response->assertDontSeeText('and again');
    }

    public function testIndexProjectsFederatedSearch()
    {
        $model = FederatedSearchModelTest::create([
            'name' => 'my remote project',
            'type' => Project::class,
        ]);

        $user = UserTest::create();
        $user->federatedSearchModels()->attach($model);
        $this->be($user);
        $this->get('search?t=projects')
            ->assertStatus(200)
            ->assertSeeText('my remote project');

        $this->get('search?t=projects&q=xyz')
            ->assertStatus(200)
            ->assertDontSeeText('my remote project');

        $user->setSettings(['include_federated_search' => false]);
        $this->get('search?t=projects')
            ->assertStatus(200)
            ->assertDontSeeText('my remote project');
    }

    public function testIndexVolumes()
    {
        $user = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::guestId());

        $volume1 = VolumeTest::create(['name' => 'my volume']);
        $project->addVolumeId($volume1->id);
        $volume2 = VolumeTest::create(['name' => 'other volume']);
        $project->addVolumeId($volume2->id);
        $volume3 = VolumeTest::create(['name' => 'third volume']);

        $this->be($user);
        $response = $this->get('search?t=volumes')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertSeeText('other volume');
        $response->assertDontSeeText('third volume');

        $response = $this->get('search?t=volumes&q=my')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertDontSeeText('other volume');
        $response->assertDontSeeText('third volume');
    }

    public function testIndexVolumesFederatedSearch()
    {
        $model = FederatedSearchModelTest::create([
            'name' => 'my remote volume',
            'type' => Volume::class,
        ]);

        $user = UserTest::create();
        $user->federatedSearchModels()->attach($model);
        $this->be($user);
        $this->get('search?t=volumes')
            ->assertStatus(200)
            ->assertSeeText('my remote volume');

        $this->get('search?t=volumes&q=xyz')
            ->assertStatus(200)
            ->assertDontSeeText('my remote volume');

        $user->setSettings(['include_federated_search' => false]);
        $this->get('search?t=volumes')
            ->assertStatus(200)
            ->assertDontSeeText('my remote volume');
    }

    public function testIndexAnnotations()
    {
        $user = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($user->id, Role::guestId());

        $image1 = ImageTest::create(['filename' => 'my image']);
        $project->addVolumeId($image1->volume_id);
        $image2 = ImageTest::create(['filename' => 'other image']);
        $project->addVolumeId($image2->volume_id);
        $image3 = ImageTest::create(['filename' => 'third image']);

        $this->be($user);
        $response = $this->get('search?t=images')->assertStatus(200);
        $response->assertSeeText('my image');
        $response->assertSeeText('other image');
        $response->assertDontSeeText('third image');

        $response = $this->get('search?t=images&q=my')->assertStatus(200);
        $response->assertSeeText('my image');
        $response->assertDontSeeText('other image');
        $response->assertDontSeeText('third image');
    }

    public function testIndexVideos()
    {
        $user = UserTest::create();
        $guest = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($guest->id, Role::guestId());

        $video1 = VideoTest::create(['filename' => 'random video']);
        $project->addVolumeId($video1->volume_id);
        $video2 = VideoTest::create(['filename' => 'another video']);
        $project->addVolumeId($video2->volume_id);

        $this->be($user);
        $this->get('search?t=videos')
            ->assertStatus(200)
            ->assertDontSeeText('random video')
            ->assertDontSeeText('another video');

        $this->be($guest);
        $this->get('search?t=videos')
            ->assertStatus(200)
            ->assertSeeText('random video')
            ->assertSeeText('another video');

        $this->get('search?t=videos&q=random')
            ->assertStatus(200)
            ->assertSeeText('random video')
            ->assertDontSeeText('another video');
    }

    public function testIndexReportsVolume()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => VolumeTest::create(['name' => 'my volume'])->id,
            'source_type' => Volume::class,
        ]);
        $r2 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'user_id' => $r1->user_id,
            'source_id' => ProjectTest::create(['name' => 'my project'])->id,
            'source_type' => Project::class,
        ]);
        $r3 = ReportTest::create();

        $this->be($r1->user);
        $this->get('search?t=reports')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertSeeText('my project')
            ->assertDontSeeText($r3->source->name);

        $this->get('search?t=reports&q=volume')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertDontSeeText('my project')
            ->assertDontSeeText($r3->source->name);
    }

    public function testIndexReportsVideo()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::videoAnnotationsCsvId(),
            'source_id' => VideoTest::create()->id,
            'source_type' => Video::class,
            'source_name' => 'my video',
        ]);

        $this->be($r1->user);
        $this->get('search?t=reports&q=video')
            ->assertStatus(200)
            ->assertSeeText('my video');
    }

    public function testIndexReportsDeleted()
    {
        $r1 = ReportTest::create([
            'source_id' => VolumeTest::create(['name' => 'my volume']),
            'source_type' => Volume::class,
        ]);
        $r1->source()->delete();

        $this->be($r1->user);
        $this->get('search?t=reports')->assertSeeText('my volume');
    }

    public function testIndexReportsWhereExists()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => VolumeTest::create(['name' => 'my volume'])->id,
            'source_type' => Volume::class,
        ]);
        $r2 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => ProjectTest::create(['name' => 'my project'])->id,
            'source_type' => Project::class,
        ]);

        $this->be($r1->user);
        $this->get('search?t=reports&q=my')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertDontSeeText('my project');
    }
}
