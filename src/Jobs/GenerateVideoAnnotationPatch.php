<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\VolumeFile;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Storage;
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


        $svgTargetPath = str_replace(config('largo.patch_format'), 'svg', $targetPath);
        $svgAnnotation = $this->getSVGAnnotationPatch($frame->width, $frame->height, $points, $this->annotation->shape);

        Storage::disk($this->targetDisk)->put($targetPath, $buffer);
        Storage::disk($this->targetDisk)->put($svgTargetPath, $svgAnnotation);
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
     * @return \Jcupitt\Vips\Image
     */
    protected function getVideoFrame(Video $video, $time)
    {
        $buffer = $video->frame(TimeCode::fromSeconds($time))->save(null, false, true);

        return VipsImage::newFromBuffer($buffer);
    }
}
