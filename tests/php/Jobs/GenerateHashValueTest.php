<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\GenerateHashValue;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
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
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'filename' => 'test.jpg',
            'volume_id' => $volume->id
        ]);
        $image1 = ImageTest::create([
            'filename' => 'test1.jpg',
            'volume_id' => $volume->id,
            'hash' => 'ujghlih'
        ]);
        $prefix = fragment_uuid_path($image->uuid);
        $format = config('thumbnails.format');

        Storage::disk(config('thumbnails.storage_disk'))->put("{$prefix}.{$format}", $image);


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
    protected function python($command)
    {
        return '024a60dfefffcfff02486dcfcffeffff010c07f1bffeffff0144907dbfffffff004018ffbbffffff00661c077ffbffff006c1e007ff7fbff8a021e679fffffef830307879707efff02c6c311af07ffff108303ebc9e9ff7f00800280c519ffff00100680c703feff018264e01217fff3018026d04100cfe3068193c0808007eb0007fb48000027bf0044df586031c7bf00093f01c003fb3f00083e226007fcd0001c78c13887e4d000143be0c265fe13000418fcf60dff1f00240bfe1e08ffe6000a0346320a6bdf000f90cff7c6e7bf000981ee334ff76f000100fff3dfffbf0137807fa9df3fbf0021813ff89e3fed0010070fbc0cbeef00020307bd0fceff00000047bf8fefff0000507f1f0fffff0000c0023c07fedf000180001c0ffd9f00000000003fffff00018000001efff3000200000666f7ff01c0000004faffefc0c0180000fbdfffc080000001ffe73f41000000496fe7330000020403ffff9f0000020c00dfffff09000006103fedff00002023833f63ff00000022c3ff479f10c8016efffff7df102200fa7ef7cbdf002200106209ee370000300d218fee1b0000060f191bf71f000001020a1ff33f000080e2248efa73000000430778f9f7000000010278e07f00012008d87fae6f00020009f99bfe6f00103418c884fb3b000010004e0ce73d0000003fd84007bf0000213dfe4e17ff00005307601cf4df';
    }

}

