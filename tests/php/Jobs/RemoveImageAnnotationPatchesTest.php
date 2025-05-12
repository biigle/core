<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\RemoveImageAnnotationPatches;
use Biigle\Tests\ImageAnnotationTest;
use Queue;
use Storage;
use TestCase;

class RemoveImageAnnotationPatchesTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = ImageAnnotationTest::create();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $path = "{$prefix}/{$annotation->id}.jpg";
        $pathSvg = "{$prefix}/{$annotation->id}.svg";
        Storage::disk('test')->put($path, 'test');
        Storage::disk('test')->put($pathSvg, 'test');

        $args = [$annotation->id => $annotation->image->uuid];
        (new RemoveImageAnnotationPatches($args))->handle();
        $this->assertFalse(Storage::disk('test')->exists($path));
        $this->assertFalse(Storage::disk('test')->exists($pathSvg));
    }

    public function testHandleChunk()
    {
        Queue::fake();
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = ImageAnnotationTest::create();
        $annotation2 = ImageAnnotationTest::create();

        $args = [
            $annotation->id => $annotation->image->uuid,
            $annotation2->id => $annotation2->image->uuid,
        ];
        (new RemoveImageAnnotationPatches($args, 1))->handle();
        Queue::assertPushed(RemoveImageAnnotationPatches::class, 2);
    }
}
