<?php

namespace Biigle\Tests\Jobs;

use File;
use Queue;
use Mockery;
use TestCase;
use VipsImage;
use Exception;
use Jcupitt\Vips\Image;
use Biigle\Tests\ImageTest;
use Biigle\Jobs\TileSingleImage;

class TileSingleImageTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();

        File::shouldReceive('isDirectory')
            ->once()
            ->with($image->tilePath)
            ->andReturn(false);

        File::shouldReceive('makeDirectory')
            ->once()
            ->with($image->tilePath);

        File::shouldReceive('get')
            ->once()
            ->with("{$image->tilePath}/ImageProperties.xml")
            ->andReturn('<IMAGE_PROPERTIES WIDTH="2352" HEIGHT="18060" NUMTILES="973" NUMIMAGES="1" VERSION="1.8" TILESIZE="256"/>');

        $mock = Mockery::mock(Image::class);
        $mock->shouldReceive('dzsave')
            ->once()
            ->with($image->tilePath, ['layout' => 'zoomify']);

        $job = new TileSingleImageStub($image);
        $job->mock = $mock;

        $this->assertFalse($image->tiled);
        $job->handle();
        $image->refresh();
        $this->assertTrue($image->tiled);
        $this->assertEquals(['width' => 2352, 'height' => 18060], $image->getTileProperties());
    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage()
    {
        return $this->mock;
    }
}
