<?php

namespace Biigle\Tests\Jobs;


use Biigle\Jobs\GenerateSimilarityIndex;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Volume;
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
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id, 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg', 'hash' => 'o8793r2hriuh9e2i3bd9']);
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg', 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        $i4 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg', 'hash' => 'kjsbfabefhlbeqwhkcbd']);
        $i5 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'd.jpg', 'hash' => 'jhsgckhqwbliejhfqkw3']);
        // Test if hash is generated per thumbnail
        with(new GenerateSimilarityIndexStub($volume))->handle();

        foreach ($volume->images as $image) {
            $this->assertIsInt($image->similarityIndex);

        }

    }
    public function testSimilarityIndexInitialization()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id, 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg', 'hash' => 'o8793r2hriuh9e2i3bd9']);
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg', 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        $i4 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg', 'hash' => 'kjsbfabefhlbeqwhkcbd']);
        $i5 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'd.jpg', 'hash' => 'jhsgckhqwbliejhfqkw3']);

        foreach ($volume->images as $image) {
            $this->assertNull($image->similarityIndex);
            $this->assertIsString($image->hash);
        }
    }

    public function testMissingHash()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id, 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg', 'hash' => 'o8793r2hriuh9e2i3bd9']);
        $i3 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $i4 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'c.jpg', 'hash' => 'kjsbfabefhlbeqwhkcbd']);
        $i5 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'd.jpg', 'hash' => 'jhsgckhqwbliejhfqkw3']);

        with(new GenerateSimilarityIndexStub($volume))->handle();
        foreach ($volume->images as $image) {
            $this->assertNull($image->similarityIndex);
        }
    }

}

class GenerateSimilarityIndexStub extends GenerateSimilarityIndex
{

    protected function python($path)
    {
        return "{2: 0, 5: 1, 4: 2, 1: 3, 3: 4}";
    }

    protected function createInputJson(Volume $volume, Array $imagesHashArray)
    {
        return 'abcd';
    }

    protected function decodeOutputJson($path) {
        return [
            2 => 0,
            5 => 1,
            4 => 2,
            1 => 3,
            3 => 4
        ];
    }
}
