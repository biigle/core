<?php

use Dias\Transect;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;

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
        $return = $this->model->createImages(['1.jpg']);
        $this->assertTrue($return);
        $this->model = $this->model->fresh();
        $this->assertNotEmpty($this->model->images);
        $this->assertEquals('1.jpg', $this->model->images()->first()->filename);
    }

    public function testCreateImagesDuplicateInsert()
    {
        $this->setExpectedException(QueryException::class);
        $return = $this->model->createImages(['1.jpg', '1.jpg']);
    }

    public function testValidateImagesFormatOk()
    {
        $this->model->validateImages(['1.jpg', '2.jpeg', '1.JPG', '2.JPEG']);
        $this->model->validateImages(['1.png', '2.PNG']);
        $this->model->validateImages(['1.gif', '2.GIF']);
    }

    public function testValidateImagesFormatNotOk()
    {
        $this->setExpectedException(ValidationException::class);
        $this->model->validateImages(['1.jpg', '2.bmp']);
    }

    public function testValidateImagesDupes()
    {
        $this->setExpectedException(ValidationException::class);
        $this->model->validateImages(['1.jpg', '1.jpg']);
    }

    public function testValidateImagesEmpty()
    {
        $this->setExpectedException(ValidationException::class);
        $this->model->validateImages([]);
    }

    public function testGenerateThumbnails()
    {
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);
        $this->model->generateThumbnails();
    }

    public function testGenerateThumbnailsOnly()
    {
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);
        $this->model->generateThumbnails([1, 2]);
    }

    public function testCastsAttrs()
    {
        $this->model->attrs = [1, 2, 3];
        $this->model->save();
        $this->assertEquals([1, 2, 3], $this->model->fresh()->attrs);
    }

    public function testParseImagesQueryString()
    {
        $return = Transect::parseImagesQueryString('');
        $this->assertEquals([], $return);

        $return = Transect::parseImagesQueryString(', 1.jpg , , 2.jpg, , , ');
        $this->assertEquals(['1.jpg', '2.jpg'], $return);

        $return = Transect::parseImagesQueryString(' 1.jpg ');
        $this->assertEquals(['1.jpg'], $return);
    }

    public function testImageCleanupEventOnDelete()
    {
        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[]]);
        Event::shouldReceive('fire'); // catch other events

        $this->model->delete();
    }

    public function testCreateImagesCreatesUuids()
    {
        $this->model->createImages(['1.jpg']);
        $image = $this->model->images()->first();
        $this->assertNotNull($image->uuid);
    }
}
