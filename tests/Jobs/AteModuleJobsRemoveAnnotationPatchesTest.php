<?php

use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;

class RemoveAnnotationPatchesTest extends TestCase
{
    public function testHandleEmpty()
    {
        $transectId = rand();
        $annotationId = rand();
        $path = config('ate.patch_storage').'/'.$transectId;
        $patchPath = $path.'/'.$annotationId.'.'.config('ate.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('files')
            ->with($path)
            ->once()
            ->andReturn([]);

        File::shouldReceive('deleteDirectory')
            ->with($path)
            ->once();

        with(new RemoveAnnotationPatches($transectId, [$annotationId]))->handle();
    }

    public function testHandleNotEmpty()
    {
        $transectId = rand();
        $annotationId = rand();
        $path = config('ate.patch_storage').'/'.$transectId;
        $patchPath = $path.'/'.$annotationId.'.'.config('ate.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('files')
            ->with($path)
            ->once()
            ->andReturn(['123.jpg']);

        File::shouldReceive('deleteDirectory')
            ->never();

        with(new RemoveAnnotationPatches($transectId, [$annotationId]))->handle();
    }
}
