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
        $this->assertNotNull($this->model->uuid);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testThumbPath()
    {
        $path = $this->model->thumbPath;
        $contains = $this->model->uuid.'.'.Image::THUMB_FORMAT;
        $this->assertContains($contains, $path);
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
        $this->model->transect_id = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testTransectOnDeleteCascade()
    {
        if ($this->isSqlite()) {
            $this->markTestSkipped('Can\'t test wit SQLite because altering foreign key constraints is not supported.');
        }
        $this->model->transect->delete();
        $this->assertNull($this->model->fresh());
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

    public function testGetThumb()
    {
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

    public function testCleanupTransectThumbnails()
    {
        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[$this->model->uuid]]);
        Event::shouldReceive('fire'); // catch other events

        $this->model->transect->delete();
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

    public function testImageCleanupEventOnDelete()
    {
        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[$this->model->uuid]]);
        Event::shouldReceive('fire'); // catch other events

        $this->model->delete();
    }

    public function testLabels()
    {
        $il = ImageLabelTest::create(['image_id' => $this->model->id]);
        $this->assertEquals(1, $this->model->labels()->count());
        $label = $this->model->labels()->first();
        $this->assertEquals($il->id, $label->id);
    }

    public function testCastsAttrs()
    {
        $this->model->attrs = ['a', 'b', 'c'];
        $this->model->save();
        $this->assertEquals(['a', 'b', 'c'], $this->model->fresh()->attrs);
    }
}
