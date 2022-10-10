<?php

namespace Biigle\Tests;

use Biigle\FederatedSearchModel;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Volume;
use ModelTestCase;

class FederatedSearchModelTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = FederatedSearchModel::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->type);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->instance);
    }

    public function testUsers()
    {
        $this->assertFalse($this->model->users()->exists());
        $user = UserTest::create();
        $this->model->users()->attach($user);
        $this->assertTrue($this->model->users()->exists());
    }

    public function testThumbnailUrlAttribute()
    {
        $this->assertNull($this->model->thumbnailUrl);
        $this->model->thumbnailUrl = 'test';
        $this->model->save();
        $this->assertNotNull($this->model->fresh()->thumbnailUrl);
    }

    public function testThumbnailUrlsAttribute()
    {
        $this->assertEmpty($this->model->thumbnailUrls);
        $this->model->thumbnailUrls = ['test'];
        $this->model->save();
        $this->assertNotEmpty($this->model->fresh()->thumbnailUrls);
    }

    public function testScopeLabelTrees()
    {
        $this->model->type = Project::class;
        $this->model->save();
        $this->assertFalse(FederatedSearchModel::labelTrees()->exists());
        $this->model->type = LabelTree::class;
        $this->model->save();
        $this->assertTrue(FederatedSearchModel::labelTrees()->exists());
    }

    public function testScopeProjects()
    {
        $this->model->type = LabelTree::class;
        $this->model->save();
        $this->assertFalse(FederatedSearchModel::projects()->exists());
        $this->model->type = Project::class;
        $this->model->save();
        $this->assertTrue(FederatedSearchModel::projects()->exists());
    }

    public function testScopeVolumes()
    {
        $this->model->type = Project::class;
        $this->model->save();
        $this->assertFalse(FederatedSearchModel::volumes()->exists());
        $this->model->type = Volume::class;
        $this->model->save();
        $this->assertTrue(FederatedSearchModel::volumes()->exists());
    }
}
