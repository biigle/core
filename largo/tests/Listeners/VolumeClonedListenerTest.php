<?php

namespace Biigle\Tests\Modules\Largo\Listeners;

use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\MediaType;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Project;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\Volume;
use Queue;
use TestCase;

class VolumeClonedListenerTest extends TestCase
{
    public function testHandleImageAnnotationPatches()
    {
        // The target project.
        $project = Project::factory()->create();

        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh();// Use fresh() to load even the null fields.
        $copy = $volume->replicate();
        $copy->save();

        $oldImage = Image::factory()->create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = ImageAnnotation::factory()->create(['image_id' => $oldImage->id]);
        ImageAnnotationLabel::factory()->create(['annotation_id' => $oldAnnotation->id]);

        Queue::fake();
        event('volume.cloned', $volume);

        Queue::assertPushed(ProcessAnnotatedImage::class);
    }

    public function testHandleVideoAnnotationPatches()
    {
        // The target project.
        $project = Project::factory()->create();

        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh();// Use fresh() to load even the null fields.
        $copy = $volume->replicate();
        $copy->save();

        $oldVideo = Video::factory()->create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = VideoAnnotation::factory()->create(['video_id' => $oldVideo->id]);
        VideoAnnotationLabel::factory()->create(['annotation_id' => $oldAnnotation->id]);

        Queue::fake();
        event('volume.cloned', $volume);

        Queue::assertPushed(ProcessAnnotatedVideo::class);
    }
}
