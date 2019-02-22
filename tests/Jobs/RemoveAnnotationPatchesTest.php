<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use File;
use Storage;
use TestCase;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;

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
}
