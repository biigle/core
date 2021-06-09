<?php

namespace Biigle\Tests\Jobs;

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
        $image = ImageTest::create([
            'filename' => 'test.jpg'
        ]);

        with(new GenerateHashValue($image))->handle();

        $image = $image->fresh();

        $this->assertIsString($image->hash);
    }
    public function testHashInitialization()
    {
        $image = ImageTest::create([
            'filename' => 'test.jpg'
        ]);

        $this->assertNull($image->hash);
    }
}

