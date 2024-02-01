<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\TileSingleImage;
use Biigle\Tests\ImageTest;
use File;
use Jcupitt\Vips\Image;
use Mockery;
use Storage;
use TestCase;

class TileSingleImageTest extends TestCase
{
    public function testGenerateTiles()
    {
        $image = ImageTest::create();
        Storage::fake('tiles');
        $job = new TileSingleImageStub($image, config('image.tiles.disk'));

        $mock = Mockery::mock(Image::class);
        $mock->shouldReceive('dzsave')
            ->once()
            ->with($job->tempPath, [
                'layout' => 'zoomify',
                'container' => 'fs',
                'strip' => true,
            ]);

        $job->mock = $mock;

        $job->generateTiles($image, '');
    }

    public function testUploadToStorage()
    {
        config(['image.tiles.disk' => 'tiles']);
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image, config('image.tiles.disk'));
        File::makeDirectory($job->tempPath);
        File::put("{$job->tempPath}/test.txt", 'test');

        try {
            Storage::fake('tiles');
            $job->uploadToStorage();
            Storage::disk('tiles')->assertExists($fragment);
            Storage::disk('tiles')->assertExists("{$fragment}/test.txt");
        } finally {
            File::deleteDirectory($job->tempPath);
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
