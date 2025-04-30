<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Tests\VideoAnnotationTest;
use File;
use Queue;
use Storage;
use TestCase;

class RemoveVideoAnnotationPatchesTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = VideoAnnotationTest::create();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $path1 = "{$prefix}/v-{$annotation->id}.jpg";
        $path2 = "{$prefix}/v-{$annotation->id}.svg";
        Storage::disk('test')->put($path1, 'test');
        Storage::disk('test')->put($path2, 'test');

        $args = [$annotation->id => $annotation->video->uuid];
        (new RemoveVideoAnnotationPatches($args))->handle();
        $this->assertFalse(Storage::disk('test')->exists($path1));
        $this->assertFalse(Storage::disk('test')->exists($path2));
    }

    public function testHandleChunk()
    {
        Queue::fake();
        Storage::fake('test');
        config(['largo.patch_storage_disk' => 'test']);
        $annotation = VideoAnnotationTest::create();
        $annotation2 = VideoAnnotationTest::create();

        $args = [
            $annotation->id => $annotation->video->uuid,
            $annotation2->id => $annotation2->video->uuid,
        ];
        (new RemoveVideoAnnotationPatches($args, 1))->handle();
        Queue::assertPushed(RemoveVideoAnnotationPatches::class, 2);
    }
}
