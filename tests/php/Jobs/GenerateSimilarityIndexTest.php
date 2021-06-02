<?php

namespace Biigle\Tests\Jobs;


use Biigle\Jobs\GenerateSimilarityIndex;
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
        // Storage::disk('test')->put('files/my-video.mp4', 'abc');
    }

    public function testHandle()
    {
        // Test if hash is generated per thumbnail
        $job = new GenerateSimilarityIndexStub();
        $job->handle();
    }
}

class GenerateSimilarityIndexStub extends GenerateSimilarityIndex
{

    protected function python($path)
    {
    }
}
