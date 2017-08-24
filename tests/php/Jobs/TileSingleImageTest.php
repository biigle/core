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

        $mock = Mockery::mock(Image::class);
        $mock->shouldReceive('dzsave')
            ->once()
            ->with($image->tilePath, ['layout' => 'zoomify']);

        $job = new TileSingleImageStub($image);
        $job->mock = $mock;

        $this->assertFalse($image->fresh()->tiled);
        $job->handle();
        $this->assertTrue($image->fresh()->tiled);
    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage()
    {
        return $this->mock;
    }
}
