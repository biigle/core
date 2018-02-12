<?php

namespace Biigle\Tests\Jobs;

use File;
use Storage;
use Mockery;
use TestCase;
use ZipArchive;
use Jcupitt\Vips\Image;
use Biigle\Tests\ImageTest;
use Biigle\Jobs\TileSingleImage;

class TileSingleImageTest extends TestCase
{
    public function testGenerateTiles()
    {
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);

        $mock = Mockery::mock(Image::class);
        $mock->shouldReceive('dzsave')
            ->once()
            ->with($job->tempPath, [
                'layout' => 'zoomify',
                'container' => 'zip',
                'strip' => true,
            ]);

        $job->mock = $mock;

        $job->generateTiles($image, '');
    }

    public function testUploadToStorage()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image);
        File::put($job->tempPath, 'test');

        try {
            Storage::fake('local-tiles');
            $job->uploadToStorage();
            Storage::disk('local-tiles')->assertExists("{$fragment}/{$image->uuid}");
        } finally {
            File::delete($job->tempPath);
        }
    }

    public function testStoreTileProperties()
    {
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);

        $zip = new ZipArchive;
        $zip->open($job->tempPath, ZipArchive::CREATE);
        $zip->addFromString("{$image->uuid}/ImageProperties.xml", '<IMAGE_PROPERTIES WIDTH="2352" HEIGHT="18060" NUMTILES="973" NUMIMAGES="1" VERSION="1.8" TILESIZE="256"/>');
        $zip->close();

        try {
            $this->assertFalse($image->tiled);
            $job->storeTileProperties();
            $image->refresh();
            $this->assertTrue($image->tiled);
            $this->assertSame(['width' => 2352, 'height' => 18060], $image->getTileProperties());
        } finally {
            File::delete($job->tempPath);
        }

    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage($path)
    {
        return $this->mock;
    }
}
