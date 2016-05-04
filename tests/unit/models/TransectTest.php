<?php

use Dias\Transect;

class TransectTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Transect::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->media_type_id);
        $this->assertNotNull($this->model->creator_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testUrlRequired()
    {
        $this->model->url = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testMediaTypeRequired()
    {
        $this->model->mediaType()->dissociate();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testMediaTypeOnDeleteRestrict()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->mediaType()->delete();
    }

    public function testCreatorOnDeleteSetNull()
    {
        $this->model->creator()->delete();
        $this->assertNull($this->model->fresh()->creator_id);
    }

    public function testImages()
    {
        $image = ImageTest::create(['transect_id' => $this->model->id]);
        $this->assertEquals($image->id, $this->model->images()->first()->id);
    }

    public function testProjects()
    {
        $project = ProjectTest::create();
        $this->assertEquals(0, $this->model->projects()->count());
        $project->addTransectId($this->model->id);
        $this->assertEquals(1, $this->model->projects()->count());
    }

    public function testProjectIds()
    {
        $project = ProjectTest::create();
        $this->assertEmpty($this->model->projectIds());
        $project->addTransectId($this->model->id);
        // clear caching of previous call
        Cache::flush();
        $ids = $this->model->projectIds();
        $this->assertNotEmpty($ids);
        $this->assertEquals($project->id, $ids[0]);
    }

    public function testSetMediaType()
    {
        $type = MediaTypeTest::create();
        $this->assertNotEquals($type->id, $this->model->mediaType->id);
        $this->model->setMediaType($type);
        $this->assertEquals($type->id, $this->model->mediaType->id);
    }

    public function testSetMediaTypeId()
    {
        $type = MediaTypeTest::create();
        $this->assertNotEquals($type->id, $this->model->mediaType->id);
        $this->model->setMediaTypeId($type->id);
        $this->assertEquals($type->id, $this->model->mediaType->id);

        // media type does not exist
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->setMediaTypeId(99999);
    }

    public function testCreateImages()
    {
        $this->assertEmpty($this->model->images);
        $this->model->createImages(['1.jpg']);
        $this->model = $this->model->fresh();
        $this->assertNotEmpty($this->model->images);
        $this->assertEquals('1.jpg', $this->model->images()->first()->filename);
    }

    public function testGenerateThumbnails()
    {
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);
        $this->model->generateThumbnails();
    }

    public function testCastsAttrs()
    {
        $this->model->attrs = [1, 2, 3];
        $this->model->save();
        $this->assertEquals([1, 2, 3], $this->model->fresh()->attrs);
    }
}
