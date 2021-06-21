<?php

namespace Biigle\Tests\Jobs;


use Biigle\Jobs\GenerateSimilarityIndex;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Exception;
use File;
use Storage;
use TestCase;

class GenerateSimilarityIndexTest extends TestCase
{
    // function like this
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake('test');
    }

    public function testHandle()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id,]);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $i4 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);
        $i5 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'd.jpg']);
        // Test if hash is generated per thumbnail
        with(GenerateSimilarityIndexStub($volume))->handle();

    }
    public function testSimilarityIndexInitialization()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id,]);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $i4 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg']);
        $i5 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'd.jpg']);

        $query = $volume->files();
        dd($query);

    }

}

class GenerateSimilarityIndexStub extends GenerateSimilarityIndex
{

    protected function python($path)
    {
    }
}
