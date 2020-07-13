<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Tests\AnnotationTest;
use File;
use Queue;
use Storage;
use TestCase;

class RemoveAnnotationPatchesTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = AnnotationTest::create();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $path = "{$prefix}/{$annotation->id}.jpg";
        Storage::disk('test')->put($path, 'test');

        $args = [$annotation->id => $annotation->image->uuid];
        (new RemoveAnnotationPatches($args))->handle();
        $this->assertFalse(Storage::disk('test')->exists($path));
    }

    public function testHandleChunk()
    {
        Queue::fake();
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = AnnotationTest::create();
        $annotation2 = AnnotationTest::create();

        $args = [
            $annotation->id => $annotation->image->uuid,
            $annotation2->id => $annotation2->image->uuid,
        ];
        (new RemoveAnnotationPatches($args, 1))->handle();
        Queue::assertPushed(RemoveAnnotationPatches::class, 2);
    }
}
