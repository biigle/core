<?php

namespace Biigle\Tests;

use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;
use Biigle\Image;
use Carbon\Carbon;
use Event;
use Illuminate\Database\QueryException;
use Mockery;
use ModelTestCase;
use Response;
use Storage;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->uuid);
        $this->assertFalse($this->model->tiled);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testGetUrl()
    {
        $this->assertEquals($this->model->url, $this->model->getUrl());
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
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testVolumeRequired()
    {
        $this->model->volume_id = null;
        $this->expectException(QueryException::class);
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
        $this->expectException(QueryException::class);
        $this->model = self::create(['filename' => 'test', 'volume_id' => $volume->id]);
    }

    public function testAnnotations()
    {
        $annotation = ImageAnnotationTest::create(['image_id' => $this->model->id]);
        ImageAnnotationTest::create(['image_id' => $this->model->id]);
        $this->assertEquals(2, $this->model->annotations()->count());
        $this->assertNotNull($this->model->annotations()->find($annotation->id));
    }

    public function testGetFile()
    {
        $this->model->mimetype = 'image/jpeg';
        $this->model->size = 123;
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
        $this->expectException(NotFoundHttpException::class);
        $this->model->getFile();
    }

    public function testGetFileRemote()
    {
        $this->model->volume->url = 'http://localhost';
        $response = $this->model->getFile();
        $this->assertEquals($this->model->url, $response->getTargetUrl());
    }

    public function testGetFileTiled()
    {
        $this->model->tiled = true;
        $this->model->width = 6000;
        $this->model->height = 7000;
        $expect = [
            'id' => $this->model->id,
            'uuid' => $this->model->uuid,
            'tiled' => true,
            'width' => 6000,
            'height' => 7000,
            'tilingInProgress' => false,
        ];
        $this->assertEquals($expect, $this->model->getFile());
    }

    public function testGetFileTiledRemote()
    {
        $this->model->volume->url = 'http://localhost';
        $this->model->tiled = true;
        $this->model->width = 6000;
        $this->model->height = 7000;
        $expect = [
            'id' => $this->model->id,
            'uuid' => $this->model->uuid,
            'tiled' => true,
            'width' => 6000,
            'height' => 7000,
            'tilingInProgress' => false,
        ];
        $this->assertEquals($expect, $this->model->getFile());
    }

    public function testGetFileTempUrl()
    {
        $mock = Mockery::mock();
        $mock->shouldReceive('providesTemporaryUrls')->once()->andReturn(true);
        $mock->shouldReceive('temporaryUrl')->once()->andReturn('https://example.com');
        Storage::shouldReceive('disk')->andReturn($mock);

        $response = $this->model->getFile();
        $this->assertEquals('https://example.com', $response->getTargetUrl());
    }

    public function testGetFileDiskNotFound()
    {
        $this->model->volume->url = 'abcd://images';
        $this->expectException(NotFoundHttpException::class);
        $this->model->getFile();
    }

    public function testImagesDeletedEventOnDelete()
    {
        Event::fake([ImagesDeleted::class]);
        $this->model->delete();
        Event::assertDispatched(ImagesDeleted::class, function ($event) {
            return $event->uuids[0] === $this->model->uuid;
        });
    }

    public function testTiledImagesDeletedEventOnDelete()
    {
        Event::fake([ImagesDeleted::class, TiledImagesDeleted::class]);
        $this->model->tiled = true;
        $this->model->save();
        $this->model->delete();
        Event::assertDispatched(ImagesDeleted::class, function ($event) {
            return $event->uuids[0] === $this->model->uuid;
        });
        Event::assertDispatched(TiledImagesDeleted::class, function ($event) {
            return $event->uuids[0] === $this->model->uuid;
        });
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

    public function testSetGetMetadataAttribute()
    {
        $this->assertEquals([], $this->model->metadata);
        $this->model->metadata = ['water_depth' => 4000];
        $this->model->save();
        $this->assertEquals(['water_depth' => 4000], $this->model->fresh()->metadata);
    }

    public function testSetGetWidthHeight()
    {
        $this->model->width = 500;
        $this->model->height = 375;
        $this->model->save();
        $this->model->refresh();
        $this->assertEquals(500, $this->model->width);
        $this->assertEquals(375, $this->model->height);
    }

    public function testSetGetSize()
    {
        $this->model->size = 12345;
        $this->model->save();
        $this->model->refresh();
        $this->assertEquals(12345, $this->model->size);
    }

    public function testSetGetMimetype()
    {
        $this->model->mimetype = 'image/jpeg';
        $this->model->save();
        $this->model->refresh();
        $this->assertEquals('image/jpeg', $this->model->mimetype);
    }

    public function testSetGetTilingInProgress()
    {
        $this->assertFalse($this->model->tilingInProgress);
        $this->model->tilingInProgress = true;
        $this->model->save();
        $this->model->refresh();
        $this->assertTrue($this->model->tilingInProgress);
    }
}
