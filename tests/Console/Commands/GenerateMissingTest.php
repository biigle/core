<?php

namespace Biigle\Tests\Modules\Largo\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Bus;
use Storage;
use TestCase;

class GenerateMissingTest extends TestCase
{
    public function testHandleImageAnnotations()
    {
        $a = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a) {
            $this->assertEquals($a->image_id, $job->file->id);
            $this->assertEquals([$a->id], $job->only);

            return true;
        });
    }

    public function testHandleVideoAnnotations()
    {
        //
    }

    public function testHandleBatching()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        $a3 = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1, $a2) {
            return $a1->image_id === $job->file->id && [$a1->id, $a2->id] === $job->only;
        });

        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a3) {
            return $a3->image_id === $job->file->id && [$a3->id] === $job->only;
        });
    }

    public function testHandleDryRun()
    {
        $a = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --dry-run');
        Bus::assertNotDispatched(ProcessAnnotatedImage::class);
    }

    public function testHandleVolume()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan("largo:generate-missing --volume={$a1->image->volume_id}");
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1) {
            $this->assertEquals($a1->image_id, $job->file->id);

            return true;
        });
    }

    public function testHandleNoImageAnnotations()
    {
        //
    }

    public function testHandleNoVideoAnnotations()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = VideoAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --no-video-annotations');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1) {
            $this->assertEquals($a1->image, $job->file);

            return true;
        });
    }

    public function testHandleQueue()
    {
        $a = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --queue=special');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) {
            $this->assertEquals('special', $job->queue);

            return true;
        });
    }

    public function testHandleNewerThan()
    {
        //
    }

    public function testHandleOlderThan()
    {
        //
    }
}
