<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Contracts\Annotation;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use Exception;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\Media\Video;
use FileCache;
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
        $video = $this->getVideo($path);

        $annotation = $this->annotation;
        if (in_array($annotation->shape_id, [Shape::polygonId(), Shape::lineId()])) {
            $annotation = $this->convertToRectangleAnnotation($annotation);
        }

        $snapshots = $this->getAnnotationSnapshots($annotation);
        $prefix = fragment_uuid_path($annotation->video->uuid)."/{$this->annotation->id}";
        $format = config('largo.patch_format');
        $disk = Storage::disk($this->targetDisk);

        foreach ($snapshots as $index => $snapshot) {
            $frame = $this->getVideoFrame($video, $snapshot['time']);
            $buffer = $this->getAnnotationPatch($frame, $snapshot['points'], $annotation->shape);

            $targetPath = "{$prefix}/{$index}.{$format}";
            $disk->put($targetPath, $buffer);
        }
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
     * Get the points and times of the snapshots that should be used as annotation
     * patches.
     *
     * @param VideoAnnotation $annotation
     *
     * @return array Contains arrays with 'points' and 'time'.
     */
    protected function getAnnotationSnapshots(VideoAnnotation $annotation)
    {
        $snapshotCount = config('largo.video_patch_count');
        $points = $annotation->points;
        $frames = $annotation->frames;
        $frameCount = count($frames);

        if ($frameCount === 0) {
            // Expect the unexpected.
            return [];
        } else if ($frameCount === 1) {
            // Handle single frame annotations.
            if (count($points) === 1) {
                return [[
                    'time' => $frames[0],
                    'points' => $points[0],
                ]];
            } else {
                // This can happen for whole frame annotations.
                return [[
                    'time' => $frames[0],
                    'points' => null,
                ]];
            }
        }

        $step = ($frames[$frameCount - 1] - $frames[0]) / ($snapshotCount - 1);
        $range = range($frames[0], $frames[$frameCount - 1], $step);

        // Sometimes there is one entry too few due to rounding errors.
        if (count($range) < $snapshotCount) {
            $range[] = $frames[$frameCount - 1];
        }

        $duration = $annotation->video->duration;
        $smallShift = 0.1 * $step;
        if ($duration > ($smallShift * 2)) {
            // FFMpeg sometimes does not extract frames from a time code that is equal
            // to 0 or $duration, so shift the firs and/or last frames in this case.
            if ($range[0] < $smallShift) {
                $range[0] = $smallShift;
            }

            if (($duration - $range[$snapshotCount - 1]) < $smallShift ) {
                $range[$snapshotCount - 1] = $duration - $smallShift;
            }
        }

        if ($annotation->shape_id === Shape::wholeFrameId()) {
            return array_map(function ($time) {
                return [
                    'time' => $time,
                    'points' => null,
                ];
            }, $range);
        }

        return array_map(function ($time) use ($annotation) {
            return [
                'time' => $time,
                'points' => $annotation->interpolatePoints($time),
            ];
        }, $range);
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

    /**
     * Convert a line or polygon annotation to a (bounding box) rectangle annotation.
     *
     * @return VideoAnnotation
     */
    protected function convertToRectangleAnnotation(VideoAnnotation $annotation)
    {
        $newAnnotation = $annotation->replicate();
        $newAnnotation->shape_id = Shape::rectangleId();
        $newAnnotation->points = array_map([$this, 'boundingBox'], $annotation->points);

        return $newAnnotation;
    }

    /**
     * Get the bounding box of a line or polygon.
     *
     * @param array $points
     *
     * @return array [x1, y1, x2, y2, x3, y3, x4, y4]
     */
    public function boundingBox(array $points)
    {
        $xmin = INF;
        $ymin = INF;
        $xmax = -INF;
        $ymax = -INF;

        $count = count($points) - 1;
        for ($i = 0; $i < $count; $i += 2) {
            $xmin = min($xmin, $points[$i]);
            $xmax = max($xmax, $points[$i]);
            $ymin = min($ymin, $points[$i + 1]);
            $ymax = max($ymax, $points[$i + 1]);
        }

        return [
            $xmin, $ymin,
            $xmin, $ymax,
            $xmax, $ymax,
            $xmax, $ymin,
        ];
    }
}
