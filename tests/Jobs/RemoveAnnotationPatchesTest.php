<?php

namespace Biigle\Tests\Modules\Ate\Jobs;

use App;
use File;
use Mockery;
use TestCase;
use FilesystemIterator;
use Biigle\Modules\Ate\Jobs\RemoveAnnotationPatches;

class RemoveAnnotationPatchesTest extends TestCase
{
    public function testHandleEmpty()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('ate.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('ate.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(true);

        $mock = Mockery::mock();
        $mock->shouldReceive('valid')->once()->andReturn(false);
        App::bind(FilesystemIterator::class, function ($app, $args) use ($path, $mock) {
            $this->assertEquals([$path, null], $args);
            return $mock;
        });

        File::shouldReceive('deleteDirectory')
            ->with($path)
            ->once();

        with(new RemoveAnnotationPatches($volumeId, [$annotationId]))->handle();
    }

    public function testHandleNotEmpty()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('ate.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('ate.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(true);

        $mock = Mockery::mock();
        $mock->shouldReceive('valid')->once()->andReturn(true);
        App::bind(FilesystemIterator::class, function () use ($mock) {
            return $mock;
        });

        File::shouldReceive('deleteDirectory')
            ->never();

        with(new RemoveAnnotationPatches($volumeId, [$annotationId]))->handle();
    }

    public function testHandleThrowsException()
    {
        $volumeId = rand();
        $annotationId = rand();
        $path = config('ate.patch_storage').'/'.$volumeId;
        $patchPath = $path.'/'.$annotationId.'.'.config('ate.patch_format');

        File::shouldReceive('delete')
            ->with($patchPath)
            ->once();

        File::shouldReceive('exists')
            ->with($path)
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();
        $mock->shouldReceive('valid')->never();
        App::bind(FilesystemIterator::class, function () use ($mock) {
            return $mock;
        });

        // no exception should be thrown
        with(new RemoveAnnotationPatches($volumeId, [$annotationId]))->handle();
    }
}
