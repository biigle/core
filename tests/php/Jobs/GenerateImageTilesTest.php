<?php

namespace Biigle\Tests\Jobs;

use Queue;
use TestCase;
use VipsImage;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\TileSingleImage;
use Biigle\Jobs\GenerateImageTiles;

class GenerateImageTilesTest extends TestCase
{
    public function testHandleSmall()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        VipsImage::shouldReceive('newFromFile')
            ->once()
            ->andReturn(new ImageMock(100, 200));

        Queue::fake();
        with(new GenerateImageTiles($volume))->handle();

        Queue::assertNotPushed(TileSingleImage::class);
    }

    public function testHandleLarge()
    {
        config(['image.tiles.threshold' => 300]);

        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id]);

        VipsImage::shouldReceive('newFromFile')
            ->once()
            ->andReturn(new ImageMock(400, 200));

        Queue::fake();
        with(new GenerateImageTiles($volume))->handle();

        Queue::assertPushed(TileSingleImage::class, function($job) use ($image) {
            return $job->image->id === $image->id;
        });
    }

    public function testHandleRemote()
    {
        $volume = VolumeTest::create(['url' => 'http://abc']);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        VipsImage::shouldReceive('newFromFile')->never();
        Queue::fake();
        with(new GenerateImageTiles($volume))->handle();

        Queue::assertNotPushed(TileSingleImage::class);
    }
}

class ImageMock extends \Jcupitt\Vips\Image
{
    public $width;
    public $height;
    function __construct($width, $height)
    {
        parent::__construct(null);
        $this->width = $width;
        $this->height = $height;
    }
}
