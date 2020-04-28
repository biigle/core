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
    public function testHandle()
    {
        $tmpDir = config('image.tiles.tmp_dir');
        $disk = Storage::fake('local-tiles');

        $image = ImageTest::create(['filename' => 'test-image.jpg']);

        $tmpPath = "{$tmpDir}/{$image->uuid}";

        $job = new TileSingleImage($image);
        $job->handle();

        $this->assertFalse(File::exists($tmpPath));
        $this->assertFalse(File::exists("{$tmpPath}.tar"));
        $this->assertFalse(File::exists("{$tmpPath}.tar.gz"));

        $fragment = fragment_uuid_path($image->uuid);

        $this->assertTrue($disk->exists("{$fragment}.tar.gz"));
    }
}

class TileSingleImageStub extends TileSingleImage
{
    protected function getVipsImage($path)
    {
        return $this->mock;
    }
}
