<?php

use Dias\Image;

class ImageTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Image::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->filename);
        $this->assertNotNull($this->model->transect_id);
        $this->assertNotNull($this->model->thumbPath);
        $this->assertNotNull($this->model->url);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testHiddenAttributes()
    {
        $json = json_decode((string) $this->model);
        $this->assertObjectNotHasAttribute('thumbPath', $json);
        $this->assertObjectNotHasAttribute('url', $json);
    }

    public function testFilenameRequired()
    {
        $this->model->filename = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testTransectRequired()
    {
        $this->model->transect = null;
        $this->setExpectedException('Exception');
        $this->model->save();
    }

    public function testTransectOnDeleteSetNull()
    {
        $this->model->transect->delete();
        $this->assertNull($this->model->fresh()->transect);
    }

    public function testFilenameTransectUnique()
    {
        $transect = TransectTest::create();
        $this->model = self::create(['filename' => 'test', 'transect_id' => $transect->id]);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model = self::create(['filename' => 'test', 'transect_id' => $transect->id]);
    }

    public function testAnnotations()
    {
        $annotation = AnnotationTest::create(['image_id' => $this->model->id]);
        AnnotationTest::create(['image_id' => $this->model->id]);
        $this->assertEquals(2, $this->model->annotations()->count());
        $this->assertNotNull($this->model->annotations()->find($annotation->id));
    }

    public function testProjectIds()
    {
        $project = ProjectTest::create();

        $this->assertEmpty($this->model->projectIds());
        $project->addTransectId($this->model->transect->id);
        // clear caching of previous call
        Cache::flush();
        $ids = $this->model->projectIds();
        $this->assertNotEmpty($ids);
        $this->assertEquals($project->id, $ids[0]);

        $this->model->transect->delete();
        $this->assertEmpty($this->model->fresh()->projectIds());
    }

    public function testGetThumbNotThere()
    {
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $response = $this->model->getThumb();
        $this->assertStringEndsWith(config('thumbnails.empty_url'), $response->getTargetUrl());
        $this->assertInstanceOf('\Illuminate\Http\RedirectResponse', $response);
    }

    public function testGetThumbIsThere()
    {
        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        Response::shouldReceive('download')
            ->once()
            ->with($this->model->thumbPath)
            ->andReturn('abc');

        $response = $this->model->getThumb();
        $this->assertEquals('abc', $response);
    }

    public function testGetFile()
    {
        Response::shouldReceive('download')
            ->once()
            ->with($this->model->url)
            ->passthru();

        $file = $this->model->getFile();
        $this->assertNotNull($file);

        // error handling when the original file is not readable
        $this->model->filename = '';

        Response::shouldReceive('download')
            ->once()
            ->passthru();

        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\NotFoundHttpException');
        $this->model->getFile();
    }

    public function testRemoveDeletedImages()
    {
        $this->model->getThumb();
        $this->assertTrue(File::exists($this->model->thumbPath));
        $this->model->transect->delete();
        $this->assertTrue(File::exists($this->model->thumbPath));
        Artisan::call('remove-deleted-images');
        $this->assertFalse(File::exists($this->model->thumbPath));
        $this->assertNull($this->model->fresh());
    }

    public function testGetExif()
    {
        $exif = $this->model->getExif();
        $this->assertEquals('image/jpeg', $exif['MimeType']);
    }

    public function testGetExifNotSupported()
    {
        $image = self::create(['filename' => 'test-image.png']);
        // should not throw an error
        $exif = $image->getExif();
        $this->assertEquals([], $exif);
    }

    public function testGetSize()
    {
        $size = $this->model->getSize();
        $this->assertEquals(640, $size[0]);
        $this->assertEquals(480, $size[1]);
    }
}
