<?php

namespace Biigle\Tests\Jobs;


use Biigle\Jobs\GenerateHashValue;
use Exception;
use File;
use Storage;
use TestCase;

class GenerateHashValueTest extends TestCase
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
        // Test if SimilarityIndex is assigened per thumbnail
        $job = new GenerateHashValueStub();
        $job->handle();
    }
}

class GenerateHashValueStub extends GenerateHashValue
{

    protected function python($path)
    {
    }
}
