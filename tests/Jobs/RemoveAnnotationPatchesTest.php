<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use File;
use TestCase;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;

class RemoveAnnotationPatchesTest extends TestCase
{
    public function testHandleEmpty()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('largo.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('largo.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(true);

        File::shouldReceive('deleteDirectory')
            ->with($path)
            ->once();

        $job = new RemoveAnnotationPatchesStub($volumeId, [$annotationId]);
        $job->returnValue = true;
        $job->handle();
        $this->assertEquals($path, $job->path);
    }

    public function testHandleNotEmpty()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('largo.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('largo.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(true);

        File::shouldReceive('deleteDirectory')
            ->never();

        $job = new RemoveAnnotationPatchesStub($volumeId, [$annotationId]);
        $job->returnValue = false;
        $job->handle();
        $this->assertNotEmpty($job->path);
    }

    public function testHandleThrowsException()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('largo.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('largo.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(false);

        $job = new RemoveAnnotationPatchesStub($volumeId, [$annotationId]);
        $job->handle();
        $this->assertEmpty($job->path);
    }
}

class RemoveAnnotationPatchesStub extends RemoveAnnotationPatches
{
    public $returnValue = false;
    public $path = '';

    protected function dirIsEmpty($path)
    {
        $this->path = $path;

        return $this->returnValue;
    }
}
