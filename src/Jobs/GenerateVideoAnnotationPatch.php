<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use VipsImage;

class GenerateVideoAnnotationPatch extends GenerateAnnotationPatch
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        if (count($this->annotation->frames) === 0) {
            // Expect the unexpected.
            return;
        }

        $points = $this->annotation->points[0] ?? null;
        $targetPath = $this->getTargetPath($this->annotation);

        $video = $this->getVideo($path);
        $frame = $this->getVideoFrame($video, $this->annotation->frames[0]);
        $buffer = $this->getAnnotationPatch($frame, $points, $this->annotation->shape);
        Storage::disk($this->targetDisk)->put($targetPath, $buffer);


        $framePath = tempnam(sys_get_temp_dir(), 'largo_video_frame').'.png';

        try {
            $frame->writeToFile($framePath);
            $this->generateFeatureVector($file, $framePath);
        } finally {
            File::delete($framePath);
        }
    }

    /**
     * Get a query for the feature vectors associated with the annotation of this job.
     */
    protected function getFeatureVectorQuery(): Builder
    {
        return VideoAnnotationLabelFeatureVector::where('annotation_id', $this->annotation->id);
    }

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    protected function createFeatureVector(array $attributes): void
    {
        VideoAnnotationLabelFeatureVector::create($attributes);
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
