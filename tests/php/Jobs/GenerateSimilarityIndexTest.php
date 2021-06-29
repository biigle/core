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
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id, 'hash' => '024a60dfefffcfff02486dcfcffeffff010c07f1bffeffff0144907dbfffffff004018ffbbffffff00661c077ffbffff006c1e007ff7fbff8a021e679fffffef830307879707efff02c6c311af07ffff108303ebc9e9ff7f00800280c519ffff00100680c703feff018264e01217fff3018026d04100cfe3068193c0808007eb0007fb48000027bf0044df586031c7bf00093f01c003fb3f00083e226007fcd0001c78c13887e4d000143be0c265fe13000418fcf60dff1f00240bfe1e08ffe6000a0346320a6bdf000f90cff7c6e7bf000981ee334ff76f000100fff3dfffbf0137807fa9df3fbf0021813ff89e3fed0010070fbc0cbeef00020307bd0fceff00000047bf8fefff0000507f1f0fffff0000c0023c07fedf000180001c0ffd9f00000000003fffff00018000001efff3000200000666f7ff01c0000004faffefc0c0180000fbdfffc080000001ffe73f41000000496fe7330000020403ffff9f0000020c00dfffff09000006103fedff00002023833f63ff00000022c3ff479f10c8016efffff7df102200fa7ef7cbdf002200106209ee370000300d218fee1b0000060f191bf71f000001020a1ff33f000080e2248efa73000000430778f9f7000000010278e07f00012008d87fae6f00020009f99bfe6f00103418c884fb3b000010004e0ce73d0000003fd84007bf0000213dfe4e17ff00005307601cf4df']);
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

    public function testOneImage()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['filename' => 'test.jpg', 'volume_id' => $volume->id, 'hash' => 'dqhdkjhqlwdlhlbsbjkk']);
        with(new GenerateSimilarityIndexStub($volume))->handle();
        foreach ($volume->images as $image) {
            $this->assertEquals(0, $image->similarityIndex);
        }
    }

}

class GenerateSimilarityIndexStub extends GenerateSimilarityIndex
{

    protected function python($path)
    {
        $i = 10;
        $imageArray = $this->volume->images()->pluck("hash", "id");
        foreach ($imageArray as $id => $hash) {
            $imageArray[$id] = $i % 5;
            $i++;
        }
        return File::put($this->getOutputJsonPath($this->volume), $imageArray);
    }
    }
