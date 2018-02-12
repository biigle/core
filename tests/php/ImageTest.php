<?php

namespace Biigle\Tests;

use Event;
use Response;
use TileCache;
use ImageCache;
use Biigle\Image;
use Carbon\Carbon;
use ModelTestCase;

class ImageTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Image::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->filename);
        $this->assertNotNull($this->model->volume_id);
        $this->assertNotNull($this->model->thumbPath);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->uuid);
        $this->assertFalse($this->model->tiled);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testThumbPath()
    {
        $path = $this->model->thumbPath;
        $contains = $this->model->uuid.'.'.config('thumbnails.format');
        $contains = "{$contains[0]}{$contains[1]}/{$contains[2]}{$contains[3]}/{$contains}";
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

    public function testVolumeRequired()
    {
        $this->model->volume_id = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testVolumeOnDeleteCascade()
    {
        $this->model->volume->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testFilenameVolumeUnique()
    {
        $volume = VolumeTest::create();
        $this->model = self::create(['filename' => 'test', 'volume_id' => $volume->id]);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model = self::create(['filename' => 'test', 'volume_id' => $volume->id]);
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
        ImageCache::shouldReceive('getStream')->once()->with($this->model)->andReturn([
            'stream' => 'abc',
            'size' => 123,
            'mime' => 'image/jpeg',
        ]);
        $response = $this->model->getFile();
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/jpeg', $response->headers->get('content-type'));
        $this->assertEquals(123, $response->headers->get('content-length'));
    }

    public function testGetFileNotFound()
    {
        // error handling when the original file is not readable
        $this->model->filename = '';
        $this->model->volume->url = 'test://abc';

        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\NotFoundHttpException');
        $this->model->getFile();
    }

    public function testGetFileRemote()
    {
        $this->model->volume->url = 'http://localhost';
        Response::shouldReceive('redirectTo')
            ->once()
            ->with($this->model->url)
            ->andReturn(true);
        $this->assertTrue($this->model->getFile());
    }

    public function testGetFileTiled()
    {
        $this->model->tiled = true;
        $this->model->setTileProperties(['width' => 6000, 'height' => 7000]);
        $expect = [
            'id' => $this->model->id,
            'uuid' => $this->model->uuid,
            'tiled' => true,
            'width' => 6000,
            'height' => 7000,
        ];
        TileCache::shouldReceive('get')->once()->with($this->model);
        $this->assertEquals($expect, $this->model->getFile());
    }

    public function testCleanupVolumeThumbnails()
    {
        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[$this->model->uuid]]);
        Event::shouldReceive('fire'); // catch other events

        $this->model->volume->delete();
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

    public function testTakenAt()
    {
        $now = Carbon::now();
        $this->model->taken_at = $now;
        $this->model->save();
        $this->assertEquals($now->timestamp, $this->model->fresh()->taken_at->timestamp);
    }

    public function testLatLng()
    {
        $this->model->lat = 55.5;
        $this->model->lng = 44.4;
        $this->model->save();
        $this->model = $this->model->fresh();
        $this->assertEquals(55.5, $this->model->lat);
        $this->assertEquals(44.4, $this->model->lng);
    }

    public function testTiledDefaultFalse()
    {
        $i = static::make();
        unset($i->tiled);
        $i->save();
        $this->assertFalse($i->fresh()->tiled);
    }

    public function testSetGetTileProperties()
    {
        $this->model->setTileProperties([
            'width' => 2352,
            'height' => 18060,
            'junk' => 973,
        ]);
        $this->model->save();

        $this->assertEquals([
            'width' => 2352,
            'height' => 18060,
        ], $this->model->fresh()->getTileProperties());
    }

    public function testSetGetMetadataAttribute()
    {
        $this->assertEquals([], $this->model->metadata);
        $this->model->metadata = ['water_depth' => 4000];
        $this->model->save();
        $this->assertEquals(['water_depth' => 4000], $this->model->fresh()->metadata);
    }
}
