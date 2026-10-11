<?php

namespace Biigle\Jobs;

use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use FFMpeg\Exception\RuntimeException;
use FFMpeg\FFProbe;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Exception as VipsException;
use Jcupitt\Vips\Image;

/**
 * @extends ProcessAnnotatedFile<VideoAnnotation>
 */
class ProcessAnnotatedVideo extends ProcessAnnotatedFile
{
    /**
     * FFProbe instance for extracting the FPS
     */
    private ?FFProbe $ffprobe = null;

    /**
     * FPS of the video
     */
    private ?float $videoFps = null;

    /**
     * Path of the video that FPS was last calculated for
     */
    private ?string $videoFpsPath = null;

    /**
     * Return the average video fps using ffprobe or fall back to 30 FPS if it failed
     * @param string $path Path to the video file
     * @return float The average FPS of the video
     */
    protected function getVideoFps(string $path): float
    {
        if ($this->videoFpsPath === $path && $this->videoFps !== null) {
            return $this->videoFps;
        }

        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        $this->videoFpsPath = $path;

        $stream = $this->ffprobe->streams($path)->videos()->first();
        if ($stream === null) {
            return $this->videoFps = 30.0;
        }

        // FFProbe returns FPS as a rational like 60/1 (60 FPS) since decimals
        // can't represent some values correctly
        $rate = $stream->get('avg_frame_rate');
        if (is_string($rate) && preg_match('/^(\d+)\/(\d+)$/', $rate, $matches) && (int) $matches[2] > 0) {
            return $this->videoFps = (float) $matches[1] / (float) $matches[2];
        }

        return $this->videoFps = 30.0;
    }

    /**
     * Calculates the length of a time window for a video at $path that is just long enough
     * to contain a few frames.
     * @param string $path Path to the video file
     * @return float A time window that contains a few frames
     */
    protected function calculateSeekWindow(string $path): float
    {
        $fps = max($this->getVideoFps($path), 0.0001);
        $window = max(0.05, 3 / $fps);

        return $window;
    }

    /**
     * {@inheritdoc}
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // The chunk size is rather low because individual video annotations can contain
        // lots of data (if they are multi-frame annotations from object tracking with
        // many annotated frames). With a chunk size too large, this could run into out
        // of memory issues.
        // Also (if feature vectors are generated), a PNG is stored for each frame in a
        // chunk. Large chunks could consume too much space.

        $window = $this->calculateSeekWindow($path);
        $this->getAnnotationQuery()
            ->chunkById(100, fn ($a) => $this->processAnnotationChunk($a, $path, $window));
    }

    /**
     * Process a chunk of annotations of this job's file.
     *
     * @param Collection<int, VideoAnnotation> $annotations
     * @param string $sourcePath Path to the video file
     * @param float $window Length of the decoding window around the annotation to obtain a frame at or before the timestamp
     */
    protected function processAnnotationChunk(Collection $annotations, string $sourcePath, float $window): void
    {
        $frameFiles = [];

        try {
            foreach ($annotations as $a) {
                $points = $a->points[0] ?? null;
                $frame = $a->frames[0];
                try {
                    $videoFrame = $this->getVideoFrame($sourcePath, $frame, $window);
                } catch (RuntimeException $e) {
                    // FFMpeg can't extract the frame.
                    continue;
                } catch (VipsException $e) {
                    // The "buffer not in known format" error when FFMPeg returns an empty
                    // buffer from the end of the video. We have the "trySeek" argument
                    // that attempts to rewind for a bit to get a frame but this may not
                    // always work.
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
     * Create the feature vectors based on the Python script output.
     *
     * @param Collection<int, VideoAnnotation> $annotations
     */
    protected function updateOrCreateFeatureVectors(Collection $annotations, \Generator $output): void
    {
        $annotations = $annotations->load('labels.label')->keyBy('id');
        foreach ($output as $row) {
            $annotation = $annotations->get($row[0]);

            foreach ($annotation->labels as $al) {
                VideoAnnotationLabelFeatureVector::updateOrCreate(
                    ['id' => $al->id],
                    [
                        'annotation_id' => $annotation->id,
                        'label_id' => $al->label_id,
                        'label_tree_id' => $al->label->label_tree_id,
                        'volume_id' => $this->file->volume_id,
                        'vector' => $row[1],
                    ]
                );
            }
        }
    }

    /**
     * Get a video frame from a specific time as VipsImage object.
     * If thumbnail creation only used ffmpeg -ss <timestamp> ... (or a library call
     * that would resolve to the same command), ffmpeg would return the frame at or
     * after the timestamp. Browsers usually display the one at or before the timestamp.
     * To mimic browser behavior, we force ffmpeg to give the frame at or before the
     * timestamp by decoding a short window around the timestamp and using the
     * `select='lte(t,<timestamp>)'` filter.
     *
     * @param string $sourcePath
     * @param float $time
     * @param float $window
     * @param int $trySeek
     *
     * @return Image
     */
    protected function getVideoFrame(string $sourcePath, float $time, float $window, ?int $trySeek = null)
    {
        // We seek back up to 2 s by default (this is based on what was required
        // for edge cases in 1.5M annotations on 16k videos).
        $fps = $this->getVideoFps($sourcePath);
        $seekStep = 1.0 / $fps;
        $trySeek ??= max(1, (int) ceil(2.0 * $fps) + 1);

        // Sometimes an annotation is near the end of the video (or exactly at the end).
        // FFMpeg often returns an empty buffer in this case. If there is an empty frame,
        // we try to seek backwards one frame until the buffer is not empty or the number
        // of tries is exceeded.
        do {
            $seekTime = sprintf('%F', max(0, $time - $window));
            $decodeDuration = sprintf('%F', 2 * $window);
            $timeString = sprintf('%F', $time);

            // Use a temporary file with random name for the jpg thumbnail file
            // We only return the buffer anyways, the file can be safely deleted later
            $tmpFile = tempnam(sys_get_temp_dir(), 'largo_video_frame');
            if ($tmpFile === false) {
                throw new RuntimeException('Could not create a temporary file.');
            }

            $outputPath = "{$tmpFile}.jpg";
            File::move($tmpFile, $outputPath);

            try {
                $result = Process::forever()
                    ->run(sprintf(
                        'ffmpeg -copyts -ss %s -t %s -i %s -vf "select=\'lte(t\\,%s)\'" -fps_mode passthrough -update 1 -y %s',
                        $seekTime,
                        $decodeDuration,
                        escapeshellarg($sourcePath),
                        $timeString,
                        escapeshellarg($outputPath)
                    ));

                if ($result->failed()) {
                    // If ffmpeg failed, throw laravel exception not handled by
                    // processAnnotationChunk, thereby stopping the process
                    $result->throw();
                }

                $buffer = File::exists($outputPath)
                    ? File::get($outputPath)
                    : '';
            } finally {
                if (File::exists($outputPath)) {
                    File::delete($outputPath);
                }
            }

            if ($buffer !== '') {
                return Image::newFromBuffer($buffer);
            }

            $trySeek -= 1;
            $time = max(0, $time - $seekStep);
        } while ($trySeek > 0);

        throw new RuntimeException('Could not extract a video frame.');
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
