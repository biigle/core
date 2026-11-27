<?php

namespace Biigle\Jobs;

use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use FFMpeg\FFProbe;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
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
     * FFProbe returns FPS as a rational like 60/1 (60 FPS) since decimals can't represent
     * some values correctly. This function parses that output into a float.
     * @param mixed $rate
     * @return float
     */
    protected function parseVideoFps(mixed $rate): float
    {
        if (is_string($rate) && preg_match('/^(\d+)\/(\d+)$/', $rate, $matches) && (int) $matches[2] > 0) {
            $fps = (float) $matches[1] / (float) $matches[2];
            if ($fps > 0 && is_finite($fps)) {
                return $fps;
            }
        }

        return 30.0;
    }

    /**
     * Return the average video fps using ffprobe or fall back to 30 FPS if it failed
     * @param string $path Path to the video file
     * @return float The average FPS of the video
     */
    protected function getVideoFps(string $path): float
    {
        if ($this->videoFps !== null) {
            return $this->videoFps;
        }

        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        $stream = $this->ffprobe->streams($path)->videos()->first();
        if ($stream === null) {
            return $this->videoFps = 30.0;
        }

        $rate = $stream->get('avg_frame_rate');
        return $this->videoFps = $this->parseVideoFps($rate);
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
                } catch (\Throwable $e) {
                    Log::error('Unexpected error while extracting a video frame.', [
                        'annotation' => $a,
                        'time' => $frame,
                        'exception' => $e,
                    ]);
                    continue;
                }

                // No frame could be found near the end of the video, even after
                // rewinding. This is expected for some annotations.
                if ($videoFrame === null) {
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
     * Get a video frame from a specific time as VipsImage object.
     * If thumbnail creation only used ffmpeg -ss <timestamp> ... (or a library call
     * that resolves to the same command), ffmpeg would return the frame at or
     * after the timestamp. Browsers usually display the one at or before the timestamp.
     * To mimic browser behavior, we force ffmpeg to give the frame at or before the
     * timestamp by decoding a short window around the timestamp and using the
     * `select='lte(t,<timestamp>)'` filter.
     *
     * @param string $sourcePath
     * @param float $time
     * @param float $window
     * @param ?int $trySeek
     *
     * @return Image|null Null if no frame could be extracted after all seek attempts.
     */
    protected function getVideoFrame(string $sourcePath, float $time, float $window, ?int $trySeek = null)
    {
        $fps = $this->getVideoFps($sourcePath);
        $frameStep = 1.0 / $fps;

        // We seek back up to 2 s, rounded up to complete decoding windows, by default
        // (this is based on what was required for edge cases in 1.5M annotations on 16k videos).
        // Since every step we decode $window seconds, calculate how many times $window fits in 2s
        $trySeek ??= max(1, (int) ceil(2.0 / $window) + 1);

        // Sometimes an annotation is near the end of the video (or exactly at the end).
        // FFMpeg often returns an empty buffer in this case. If there is an empty frame,
        // we try to seek backwards by $window until the buffer is not empty or the number
        // of tries is exceeded.
        do {
            $seekTime = sprintf('%F', max(0, $time - $window));
            $decodeDuration = sprintf('%F', $window + $frameStep);
            $timeString = sprintf('%F', $time);

            // Use a temporary file with random name for the jpg thumbnail file
            // We only return the buffer anyways, the file can be safely deleted later
            $tmpFile = tempnam(sys_get_temp_dir(), 'largo_video_frame');
            if ($tmpFile === false) {
                throw new \RuntimeException('Could not create a temporary file.');
            }

            $outputPath = "{$tmpFile}.jpg";
            File::move($tmpFile, $outputPath);

            try {
                // Command explanation:
                // -copyts -start_at_zero: This makes sure that if the timestamp of the first frame is not zero,
                // the decoded frames have timestamps relative to the start of the video.
                // Example: If start timestamp is -5s, and we seek to 10s after start, then frames would have
                // timestamps starting at 5s. But we want them to start at 10s
                // -ss <start>: Seek to <start> seconds after video start
                // -t <window>: Decode a small <window> containing only a few frames
                // -i <file>: Input file
                // -vf "select='lte(t,<timestamp>)'": Keep only decoded frames with a timestamp <= <timestamp>.
                // To be consistent with mediabunny in the frontend, which always gives the frame at or
                // before a given timestamp, we are only interested in the last frame that satisfies
                // timestamp <= <timestamp>. By default, ffmpeg gives the frame at or after a given timestamp,
                // so we need this filter
                // -enc_time_base filter: The timestamp of a frame is time base * pts. The filter graph uses
                // the (often very fine) time base of the input stream, whereas the encoder uses 1 / FPS by
                // default. Variable frame rate videos can have frames closer together than 1 / FPS. Their
                // timestamps would be rounded to the same pts and the encoder would exit with an error.
                // This option tells the encoder to use the same time base as the filter graph
                // -fps_mode passthrough: ffmpeg uses an MJPEG video encoder to encode the selected frames
                // as JPEGs, and by default, it may drop or duplicate frames to achieve a constant frame rate.
                // This flag disables that
                // -update 1: Option for ffmpeg's image2 output muxer. Tells the muxer to treat the output
                // filename as a single file and overwrite for each frame (we only care about the last anyways)
                // -y: Don't ask when overwriting the last image file
                $result = Process::timeout(30)
                    ->run(sprintf(
                        'ffmpeg -copyts -start_at_zero -ss %s -t %s -i %s -vf "select=\'lte(t\\,%s)\'" -enc_time_base filter -fps_mode passthrough -update 1 -y %s',
                        $seekTime,
                        $decodeDuration,
                        escapeshellarg($sourcePath),
                        $timeString,
                        escapeshellarg($outputPath)
                    ));

                // The exception includes the ffmpeg output, which is logged by
                // processAnnotationChunk.
                $result->throw();

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
            $time = max(0, $time - $window);
        } while ($trySeek > 0);

        return null;
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
