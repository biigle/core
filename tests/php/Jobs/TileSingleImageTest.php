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
            Storage::disk('local-tiles')->assertExists($fragment);
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
