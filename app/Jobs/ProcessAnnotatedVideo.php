<?php

namespace Biigle\Jobs;

use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use FFMpeg\Exception\RuntimeException;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Exception as VipsException;
use Jcupitt\Vips\Image;
use Throwable;

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
     * {@inheritdoc}
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // The chunk size is rather low because individual video annotations can contain
        // lots of data (if they are multi-frame annotations from object tracking with
        // many annotated frames). With a chunk size too large, this could run into out
        // of memory issues.
        // Also (if feature vectors are generated), a PNG is stored for each frame in a
        // chunk. Large chunks could comsume too much space.
        $this->getAnnotationQuery($file)
            ->chunkById(100, fn ($a) => $this->processAnnotationChunk($a, $path));
    }

    /**
     * Process a chunk of annotations of this job's file.
     *
     * @param Collection<int, VideoAnnotation> $annotations
     */
    protected function processAnnotationChunk(Collection $annotations, string $sourcePath): void
    {
        $frameFiles = [];

        try {
            foreach ($annotations as $a) {
                $points = $a->points[0] ?? null;
                $frame = $a->frames[0];
                try {
                    $videoFrame = $this->getVideoFrame($sourcePath, $frame);
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
     * Get the FFMpeg video instance.
     *
     * @param string $path
     */
    protected function getVideo($path)
    {
        return FFMpeg::create()->open($path);
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
     * @param int $trySeek
     *
     * @return Image
     */
    protected function getVideoFrame(string $sourcePath, float $time, int $trySeek = 60)
    {
        $fps = max($this->getVideoFps($sourcePath), 0.0001);
        $window = max(0.05, 3 / $fps);

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
                Process::forever()
                    ->run(sprintf(
                        'ffmpeg -copyts -ss %s -t %s -i %s -vf "select=\'lte(t\\,%s)\'" -fps_mode passthrough -update 1 -y %s',
                        $seekTime,
                        $decodeDuration,
                        escapeshellarg($sourcePath),
                        $timeString,
                        escapeshellarg($outputPath)
                    ))
                    ->throw();

                $buffer = File::get($outputPath);
            } catch (Throwable $e) {
                $buffer = '';
            } finally {
                if (File::exists($outputPath)) {
                    File::delete($outputPath);
                }
            }

            if (!empty($buffer)) {
                return Image::newFromBuffer($buffer);
            }

            $trySeek -= 1;
            // Roughly estimated framerate of 30 fps. With 60 iterations, we seek back up
            // to 2 s by default (this is based on what was required for edge cases in
            //  1.5M annotations on 16k videos).
            $time = max(0, $time - (1 / 30.0));
        } while ($trySeek > 0);

        throw new RuntimeException('Could not extract a video frame.');
    }

    /**
     * Return the average video fps using ffprobe or fall back to 30 FPS if it failed
     * @param string $path Path to the video file
     * @return float The average FPS of the video
     */
    protected function getVideoFps(string $path): float
    {
        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        $stream = $this->ffprobe->streams($path)->videos()->first();
        if ($stream === null) {
            return 30.0;
        }

        // FFProbe returns FPS as a rational like 60/1 (60 FPS) since decimals
        // can't represent some values correctly
        $rate = $stream->get('avg_frame_rate');
        if (is_string($rate) && preg_match('/^(\d+)\/(\d+)$/', $rate, $matches) && (int) $matches[2] > 0) {
            return (float) $matches[1] / (float) $matches[2];
        }

        return 30.0;
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
}
