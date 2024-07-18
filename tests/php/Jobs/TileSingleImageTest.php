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
        $targetPath = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image, config('image.tiles.disk'), $targetPath);

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
        $targetPath = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image, config('image.tiles.disk'), $targetPath);
        File::makeDirectory($job->tempPath);
        File::put("{$job->tempPath}/test.txt", 'test');

        try {
            $job->uploadToStorage();
            Storage::disk('tiles')->assertExists($targetPath);
            Storage::disk('tiles')->assertExists("{$targetPath}/test.txt");
        } finally {
            File::deleteDirectory($job->tempPath);
        }
    }

    public function testHandleFunction()
    {
        $image = ImageTest::create();
        $image->tilingInProgress = true;
        $targetPath = fragment_uuid_path($image->uuid);
        $job = new TileSingleImage($image, config('image.tiles.disk'), $targetPath);

        $this->assertEquals($job->file->tilingInProgress, true);
        // execute the job with handle() method
        $job->handle();
        $this->assertEquals($job->file->tilingInProgress, false);
        Storage::disk('tiles')->assertExists($targetPath);
        // check that temporary storage path got properly deleted in handle() method
        Storage::disk('tiles')->assertMissing($job->tempPath);
    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage($path)
    {
        return $this->mock;
    }
}
