<?php

namespace Biigle\Tests\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use TestCase;

class FilesystemManagerTest extends TestCase
{
    function testAddConfigResolver()
    {
        Storage::addConfigResolver(function ($name) {
            if ($name === 'mydisk') {
                return [
                    'driver' => 'local',
                    'root' => 'abc',
                ];
            }

            return null;
        });

        // Should resolve the new disk with the config provided by the resolver.
        $disk = Storage::disk('mydisk');
        $this->assertInstanceOf(FilesystemAdapter::class, $disk);

        // Should still return the regular disk, not hindered by the resolver.
        $disk = Storage::disk('test');
        $this->assertInstanceOf(FilesystemAdapter::class, $disk);
    }
}
