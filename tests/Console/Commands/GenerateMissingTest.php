<?php

namespace Biigle\Tests\Modules\Largo\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
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
            $this->assertSame($a->image_id, $job->file->id);
            $this->assertSame([$a->id], $job->only);

            return true;
        });
    }

    public function testHandleImageAnnotationsSkipExisting()
    {
        $a = ImageAnnotation::factory()->create();
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a), 'abc');
        $disk->put(ProcessAnnotatedImage::getTargetPath($a, format: 'svg'), 'abc');
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertNotDispatched(ProcessAnnotatedImage::class);
    }

    public function testHandleVideoAnnotations()
    {
        $a = VideoAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertDispatched(ProcessAnnotatedVideo::class, function ($job) use ($a) {
            $this->assertSame($a->video_id, $job->file->id);
            $this->assertSame([$a->id], $job->only);

            return true;
        });
    }

    public function testHandleVideoAnnotationsSkipExisting()
    {
        $a = VideoAnnotation::factory()->create();
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedVideo::getTargetPath($a), 'abc');
        $disk->put(ProcessAnnotatedVideo::getTargetPath($a, format: 'svg'), 'abc');
        $al = VideoAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        VideoAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertNotDispatched(ProcessAnnotatedVideo::class);
    }

    public function testHandleForce()
    {
        $a = ImageAnnotation::factory()->create();
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a), 'abc');
        $disk->put(ProcessAnnotatedImage::getTargetPath($a, format: 'svg'), 'abc');
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --force');
        Bus::assertDispatched(ProcessAnnotatedImage::class);
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
            $this->assertSame($a1->image_id, $job->file->id);

            return true;
        });
    }

    public function testHandleSkipImages()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = VideoAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-images');
        Bus::assertDispatched(ProcessAnnotatedVideo::class, function ($job) use ($a2) {
            $this->assertEquals($a2->video, $job->file);

            return true;
        });

        Bus::assertNotDispatched(ProcessAnnotatedImage::class);
    }

    public function testHandleSkipVideos()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = VideoAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-videos');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1) {
            $this->assertEquals($a1->image, $job->file);

            return true;
        });

        Bus::assertNotDispatched(ProcessAnnotatedVideo::class);
    }

    public function testHandleQueue()
    {
        $a = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --queue=special');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) {
            $this->assertSame('special', $job->queue);

            return true;
        });
    }

    public function testHandleNewerThan()
    {
        $a1 = ImageAnnotation::factory()->create([
            'created_at' => '2024-01-24',
        ]);

        $a2 = ImageAnnotation::factory()->create([
            'created_at' => '2024-01-20',
            'image_id' => $a1->image_id,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --newer-than=2024-01-23');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1) {
            $this->assertSame($a1->image_id, $job->file->id);
            $this->assertSame([$a1->id], $job->only);

            return true;
        });
    }

    public function testHandleOlderThan()
    {
        $a1 = ImageAnnotation::factory()->create([
            'created_at' => '2024-01-24',
        ]);

        $a2 = ImageAnnotation::factory()->create([
            'created_at' => '2024-01-20',
            'image_id' => $a1->image_id,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --older-than=2024-01-23');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a2) {
            $this->assertSame($a2->image_id, $job->file->id);
            $this->assertSame([$a2->id], $job->only);

            return true;
        });
    }

    public function testHandleSkipVectors()
    {
        $a1 = ImageAnnotation::factory()->create();
        $a2 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a1), 'abc');
        $disk->put(ProcessAnnotatedImage::getTargetPath($a1, format: 'svg'), 'abc');

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-vectors');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a2) {
            $this->assertSame($a2->image_id, $job->file->id);
            $this->assertSame([$a2->id], $job->only);
            $this->assertTrue($job->skipFeatureVectors);
            $this->assertFalse($job->skipPatches);
            $this->assertFalse($job->skipSvgs);

            return true;
        });
    }

    public function testHandleSkipPatches()
    {
        $a1 = ImageAnnotation::factory()->create();
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a1->id]);
        $a2 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a1, format: 'svg'), 'abc');
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a1,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-patches');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a2) {
            $this->assertSame($a2->image_id, $job->file->id);
            $this->assertSame([$a2->id], $job->only);
            $this->assertFalse($job->skipFeatureVectors);
            $this->assertTrue($job->skipPatches);
            $this->assertFalse($job->skipSvgs);

            return true;
        });
    }

    public function testHandleSkipSvgs()
    {
        $a1 = ImageAnnotation::factory()->create();
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a1->id]);
        $a2 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a1), 'abc');
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a1,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-svgs');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a2) {
            $this->assertSame($a2->image_id, $job->file->id);
            $this->assertSame([$a2->id], $job->only);
            $this->assertFalse($job->skipFeatureVectors);
            $this->assertFalse($job->skipPatches);
            $this->assertTrue($job->skipSvgs);

            return true;
        });
    }

    public function testHandleMixedPatchesVectors()
    {
        $a1 = ImageAnnotation::factory()->create();
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a1->id]);
        $a2 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        $a3 = ImageAnnotation::factory()->create(['image_id' => $a1->image_id]);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a1,
        ]);
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $disk->put(ProcessAnnotatedImage::getTargetPath($a2), 'abc');
        $disk->put(ProcessAnnotatedImage::getTargetPath($a3, format: 'svg'), 'abc');

        Bus::fake();
        $this->artisan('largo:generate-missing');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1, $a2, $a3) {
            $this->assertSame($a1->image_id, $job->file->id);
            $this->assertSame([$a1->id, $a2->id, $a3->id], $job->only);

            return true;
        });
    }

    public function testHandleForceWithVectors()
    {
        $a1 = ImageAnnotation::factory()->create();
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a1->id]);
        ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $a1,
        ]);

        Bus::fake();
        $this->artisan('largo:generate-missing --skip-svgs --skip-patches --force');
        Bus::assertDispatched(ProcessAnnotatedImage::class, function ($job) use ($a1) {
            $this->assertSame($a1->image_id, $job->file->id);
            $this->assertSame([$a1->id], $job->only);
            $this->assertFalse($job->skipFeatureVectors);
            $this->assertTrue($job->skipPatches);
            $this->assertTrue($job->skipSvgs);

            return true;
        });
    }

    public function testHandleChunkSize()
    {
        $a = ImageAnnotation::factory()->create();
        $a2 = ImageAnnotation::factory()->create();

        Bus::fake();
        $this->artisan('largo:generate-missing --chunk-size=1');
        Bus::assertDispatched(ProcessAnnotatedImage::class);
    }
}
