<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use VipsImage;

class ProcessAnnotatedVideo extends ProcessAnnotatedFile
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        $annotations = VideoAnnotation::where('video_id', $file->id)->get();

        $video = $this->getVideo($path);

        $frameFiles = [];

        try {
            $annotations->each(function ($a) use ($video, &$frameFiles) {
                $points = $a->points[0] ?? null;
                $frame = $a->frames[0];
                $videoFrame = $this->getVideoFrame($video, $frame);
                $buffer = $this->getAnnotationPatch($videoFrame, $points, $a->shape);
                $targetPath = self::getTargetPath($a);
                Storage::disk($this->targetDisk)->put($targetPath, $buffer);

                if (!array_key_exists($frame, $frameFiles)) {
                    $framePath = tempnam(sys_get_temp_dir(), 'largo_video_frame').'.png';
                    $videoFrame->writeToFile($framePath);
                    $frameFiles[$frame] = $framePath;
                }
            });

            $annotationFrames = $annotations->mapWithKeys(
                    fn ($a) => [$a->id => $frameFiles[$a->frames[0]]]
                )
                ->toArray();

            $this->generateFeatureVectors($annotations, $annotationFrames);
        } finally {
            File::delete(array_values($frameFiles));
        }
    }

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    protected function updateOrCreateFeatureVector(array $id, array $attributes): void
    {
        VideoAnnotationLabelFeatureVector::updateOrCreate($id, $attributes);
    }

    /**
     * Get the FFMpeg video instance.
     *
     * @param string $path
     *
     * @return Video
     */
    protected function getVideo($path)
    {
        return FFMpeg::create()->open($path);
    }

    /**
     * Get a video frame from a specific time as VipsImage object.
     *
     * @param Video $video
     * @param float $time
     *
     * @return \Jcupitt\Vips\Video
     */
    protected function getVideoFrame(Video $video, $time)
    {
        $buffer = $video->frame(TimeCode::fromSeconds($time))->save(null, false, true);

        return VipsImage::newFromBuffer($buffer);
    }
}
