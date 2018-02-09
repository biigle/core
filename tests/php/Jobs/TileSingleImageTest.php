<?php

namespace Biigle\Tests\Jobs;

use File;
use Storage;
use Mockery;
use TestCase;
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
            ->with($job->tempPath, ['layout' => 'zoomify']);

        $job->mock = $mock;

        File::shouldReceive('isDirectory')
            ->once()
            ->with($job->tempPath)
            ->andReturn(false);

        File::shouldReceive('makeDirectory')
            ->once()
            ->with($job->tempPath);

        $job->generateTiles($image, '');
    }

    public function testUploadToStorage()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image);
        File::makeDirectory($job->tempPath);
        File::makeDirectory("{$job->tempPath}/2");

        try {
            File::put("{$job->tempPath}/1.txt", 'test 1');
            File::put("{$job->tempPath}/2/3.txt", 'test 2');
            Storage::fake('local-tiles');
            $job->uploadToStorage();
            Storage::disk('local-tiles')->assertExists("{$fragment}/1.txt");
            Storage::disk('local-tiles')->assertExists("{$fragment}/2/3.txt");
        } finally {
            File::deleteDirectory($job->tempPath);
        }
    }

    public function testStoreTileProperties()
    {
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);

        File::shouldReceive('get')
            ->once()
            ->with("{$job->tempPath}/ImageProperties.xml")
            ->andReturn('<IMAGE_PROPERTIES WIDTH="2352" HEIGHT="18060" NUMTILES="973" NUMIMAGES="1" VERSION="1.8" TILESIZE="256"/>');

        $this->assertFalse($image->tiled);
        $job->storeTileProperties();
        $image->refresh();
        $this->assertTrue($image->tiled);
        $this->assertSame(['width' => 2352, 'height' => 18060], $image->getTileProperties());
    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage($path)
    {
        return $this->mock;
    }
}
