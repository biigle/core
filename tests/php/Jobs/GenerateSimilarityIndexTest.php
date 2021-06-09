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
        $image = ImageTest::create([
            'filename' => 'test.jpg',
            'volume_id' => $volume->id,
        ]);
        // Test if hash is generated per thumbnail
        $job = new GenerateSimilarityIndexStub($image);
        $job->handle();
    }
    public function testSimilarityIndexInitialization()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'test.jpg',
            'volume_id' => $volume->id,
        ]);

    }

}

class GenerateSimilarityIndexStub extends GenerateSimilarityIndex
{

    protected function python($path)
    {
    }
}
