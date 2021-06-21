<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\GenerateHashValue;
use Biigle\Tests\ImageTest;
use Exception;
use File;
use Log;
use Storage;
use TestCase;

class GenerateHashValueTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake('test');
        Storage::fake(config('thumbnails.storage_disk'));
    }
    public function testHandle()
    {
        Storage::disk(config('thumbnails.storage_disk'))->put('test.jpg', 'test_data');
        $image = ImageTest::create([
            'filename' => 'test.jpg'
        ]);

        with(new GenerateHashValueStub($image))->handle();

        $image = $image->fresh();

        $this->assertNotNull($image->hash);
    }
    public function testHashInitialization()
    {
        $image = ImageTest::create([
            'filename' => 'test.jpg'
        ]);

        $this->assertNull($image->hash);
    }
}

class GenerateHashValueStub extends GenerateHashValue
{
    public $fakePythonOutput = "{'hash': 'jmhsdgfmasgh'}";

    protected function python($command)
    {
        File::put($this->getOutputJsonPath($this->image), $this->fakePythonOutput);
    }


    protected function getThumbnail(Image $image)
    {
        return b'\xe1\x88\xb4';
    }


    /*
    protected function decodeOutputJson($path) {
        return [
            "id" => 1,
            "hash" => 'hopfullyAHashValue'
        ];
    }
    */


     protected function createInputJson(Image $image, $imageAsByteString)
    {
        return 'abcd';
    }

}

