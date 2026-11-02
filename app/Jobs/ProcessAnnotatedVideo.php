<?php

namespace Biigle\Jobs;

use Alchemy\BinaryDriver\Exception\ExecutionFailureException;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use FFMpeg\Exception\RuntimeException;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Exception as VipsException;
use Jcupitt\Vips\Image;

/**
 * @extends ProcessAnnotatedFile<VideoAnnotation>
 */
class ProcessAnnotatedVideo extends ProcessAnnotatedFile
{
    /**
     * Lengths of the segments of the video (in seconds) before the time of an annotation
     * that are decoded to find the frame of the annotation if a segment of two frames
     * does not contain it (e.g. for annotations at the end of the video or for videos
     * with a variable frame rate).
     *
     * @var array<float>
     */
    const FRAME_SEARCH_WINDOWS = [1.0, 3.0];

    /**
     * {@inheritdoc}
     */
    public function handleFile(VolumeFile $file, $path)
    {
        $video = $this->getVideo($path);
        // The chunk size is rather low because individual video annotations can contain
        // lots of data (if they are multi-frame annotations from object tracking with
        // many annotated frames). With a chunk size too large, this could run into out
        // of memory issues.
        // Also (if feature vectors are generated), a PNG is stored for each frame in a
        // chunk. Large chunks could comsume too much space.
        $this->getAnnotationQuery()
            ->chunkById(100, fn ($a) => $this->processAnnotationChunk($a, $video));
    }

    /**
     * Process a chunk of annotations of this job's file.
     *
     * @param Collection<int, VideoAnnotation> $annotations
     */
    protected function processAnnotationChunk(Collection $annotations, Video $video): void
    {
        $frameFiles = [];

        try {
            foreach ($annotations as $a) {
                $points = $a->points[0] ?? null;
                $frame = $a->frames[0];
                try {
                    $videoFrame = $this->getVideoFrame($video, $frame);
                } catch (RuntimeException $e) {
                    // FFMpeg can't extract the frame.
                    continue;
                } catch (VipsException $e) {
                    // The frame file could not be read.
                    continue;
                }

                if (!$this->skipPatches) {
                    $buffer = $this->getAnnotationPatch($videoFrame, $points, $a->shape);
                    $targetPath = self::getTargetPath($a);
                    Storage::disk($this->targetDisk)->put($targetPath, $buffer);
                }

                if (!$this->skipFeatureVectors && !array_key_exists("{$frame}", $frameFiles)) {
                    $tmpFile = tempnam(sys_get_temp_dir(), 'largo_video_frame');
                    $framePath = "{$tmpFile}.png";
                    // The file requires a suffix so FFMpeg knows which format to use.
                    // Since tempnam() does not create a suffix, we have to rename the
                    // file.
                    File::move($tmpFile, $framePath);
                    $videoFrame->writeToFile($framePath);
                    $frameFiles["{$frame}"] = $framePath;
                }
            }

            if (!$this->skipFeatureVectors) {
                $annotationFrames = $annotations->mapWithKeys(
                    fn ($a) => [$a->id => $frameFiles["{$a->frames[0]}"] ?? null]
                )->filter()->toArray();

                $this->generateFeatureVectors($annotations, $annotationFrames);
            }
        } finally {
            File::delete(array_values($frameFiles));
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function getFeatureVectorModel(): string
    {
        return VideoAnnotationLabelFeatureVector::class;
    }

    /**
     * Get the FFMpeg video instance.
     *
     * @param string $path
     */
    protected function getVideo($path)
    {
        return FFMpeg::create()->open($path);
    }

    /**
     * Get the video frame that is shown at a specific time as VipsImage object.
     *
     * This is the last frame that starts at or before the time (like in the browser).
     * If FFMpeg seeks to the time directly, it returns the first frame that starts at
     * or after the time instead. This is the next frame if the time is not exactly at
     * the start of a frame. See: https://github.com/biigle/core/issues/433
     *
     * @param Video $video
     * @param float $time
     *
     * @return Image
     */
    protected function getVideoFrame(Video $video, float $time)
    {
        // Browsers handle the time with microsecond precision. E.g. Chromium truncates
        // 2.9696333 s (the exact start of frame 89 with 29.97 fps: 89 * 1001 / 30000 s)
        // to 2.969633 s and shows frame 88. The small offset compensates floating point
        // errors.
        $time = floor($time * 1e6 + 1e-3) / 1e6;

        $tmpFile = tempnam(sys_get_temp_dir(), 'largo_video_frame');
        // The file requires a suffix so FFMpeg knows which format to use.
        $framePath = "{$tmpFile}.jpg";
        File::move($tmpFile, $framePath);

        try {
            // Decode a short segment of the video before the time and keep the last
            // frame. If the segment contains no frame (e.g. if the time is beyond the
            // end of the video), a longer segment is tried.
            foreach ($this->getFrameSearchWindows($video) as $window) {
                $this->extractLastFrameBefore($video, $time, $window, $framePath);
                if (File::size($framePath) > 0) {
                    return Image::newFromBuffer(File::get($framePath));
                }
            }
        } finally {
            File::delete($framePath);
        }

        throw new RuntimeException("Unable to extract the video frame at {$time} s.");
    }

    /**
     * Get the lengths of the segments of the video (in seconds) before the time of an
     * annotation that are decoded to find the frame of the annotation.
     *
     * All frames of a segment are extracted. The first segment spans two frames
     * (based on the average frame rate) so only few frames have to be extracted.
     *
     * @param Video $video
     *
     * @return array<float>
     */
    protected function getFrameSearchWindows(Video $video): array
    {
        $windows = self::FRAME_SEARCH_WINDOWS;
        // E.g. "30000/1001".
        $frameRate = $video->getStreams()->videos()->first()?->get('avg_frame_rate');
        $frameRate = array_map('floatval', explode('/', $frameRate ?? ''));

        if (count($frameRate) === 2 && $frameRate[0] > 0 && $frameRate[1] > 0) {
            $window = 2 * $frameRate[1] / $frameRate[0];
            if ($window < $windows[0]) {
                array_unshift($windows, $window);
            }
        }

        return $windows;
    }

    /**
     * Write the last frame that starts at or before the time to the file. The file is
     * not changed if the segment of the video before the time contains no frame.
     *
     * @param Video $video
     * @param float $time Time of the frame in seconds.
     * @param float $window Length of the segment before the time in seconds.
     * @param string $path Path to the JPEG file to write the frame to.
     */
    protected function extractLastFrameBefore(Video $video, float $time, float $window, string $path): void
    {
        $start = max(0, $time - $window);

        try {
            $video->getFFMpegDriver()->command([
                '-y',
                // Keep the original timestamps (relative to the start of the video like
                // the seek position) so they are compared with the exact time below.
                '-copyts',
                '-start_at_zero',
                '-ss', sprintf('%.6F', $start),
                // Only decode the segment up to the time (and a bit more).
                '-t', sprintf('%.6F', $time - $start + 0.1),
                '-i', $video->getPathfile(),
                '-an',
                // Select all frames that start at or before the time (with a tolerance
                // for floating point errors)...
                '-vf', sprintf("select='lte(t\\,%.9F)'", $time + 1e-9),
                // ...and keep only the last one in the file.
                '-update', '1',
                // JPEG with very high quality. This is much faster than PNG.
                '-c:v', 'mjpeg',
                '-q:v', '2',
                '-f', 'image2',
                $path,
            ]);
        } catch (ExecutionFailureException $e) {
            throw new RuntimeException('Unable to extract the video frame.', $e->getCode(), $e);
        }
    }

    /**
     * {@inheritdoc}
     *
     * @return Builder<VideoAnnotation>
     */
    protected function getBaseAnnotationQuery(): Builder
    {
        return VideoAnnotation::where('video_id', $this->file->id);
    }

    /**
     * {@inheritdoc}
     */
    protected function getQueueConfigKey(): string
    {
        return 'largo.generate_video_annotation_patch_queue';
    }
}
