<?php

namespace Biigle\Jobs;

use Biigle\Events\ObjectTrackingFailed;
use Biigle\Events\ObjectTrackingSucceeded;
use Biigle\Shape;
use Biigle\User;
use Biigle\VideoAnnotation;
use Exception;
use File;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Log;

/**
 * Attempts to track an obect in a video. The object is initially defined by a video
 * annotation. The annotation will be updated with the positions determined with the
 * object tracking method.
 */
class TrackObject extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * The annotation ID that defines the initial object to track.
     *
     * @var int
     */
    protected $annotationId;

    /**
     * The user ID who initialized the tracking request.
     *
     * @var int
     */
    protected $userId;

    /**
     * Return the cache key to store the number of concurrent jobs for each user.
     *
     * @param int $userId
     *
     * @return string
     */
    public static function getRateLimitCacheKey(int $userId)
    {
        return "object-tracking-jobs-{$userId}";
    }

    /**
     * Create a new instance.
     *
     * @param VideoAnnotation $annotation The annotation that defines the initial object to track.
     * @param User $user The user who initialized the tracking request.
     */
    public function __construct(VideoAnnotation $annotation, User $user)
    {
        $this->annotationId = $annotation->id;
        $this->userId = $user->id;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $annotation = VideoAnnotation::find($this->annotationId);
        $user = User::find($this->userId);

        if (!$annotation || !$user) {
            $this->decrementCacheValue();
            return;
        }

        try {
            $keyframes = $this->getTrackingKeyframes($annotation);
            $frames = $annotation->frames;
            $points = $annotation->points;

            if (empty($keyframes)) {
                throw new Exception("Empty keyframes.");
            }

            foreach ($keyframes as $keyframe) {
                $frames[] = $keyframe[0];
                $points[] = $this->getPointsFromKeyframe($annotation, $keyframe);
            }

            $annotation->frames = $frames;
            $annotation->points = $points;
            // If the annotation has been deleted in the meantime, ignore the result.
            if ($annotation->exists()) {
                $annotation->save();
                ObjectTrackingSucceeded::dispatch($annotation, $user);
            }
        } catch (Exception $e) {
            Log::warning("Could not track object for video {$annotation->video->id}: {$e->getMessage()}");
            ObjectTrackingFailed::dispatch($annotation, $user);
        } finally {
            $this->decrementCacheValue();
        }
    }

    /**
     * Execute the object tracking method and get the resulting annotation key frames.
     *
     * @param VideoAnnotation $annotation
     *
     * @return array Each element is an array containing the key frame time as first element and the points as the remaining elements.
     */
    protected function getTrackingKeyframes(VideoAnnotation $annotation)
    {
        return FileCache::get($annotation->video, function ($video, $path) use ($annotation) {
            $script = config('videos.object_tracker_script');
            $checkpointUrl = config('videos.model_url');
            $checkpointPath = config('videos.model_path');
            $this->maybeDownloadCheckpoint($checkpointUrl, $checkpointPath);
            try {
                $inputPath = $this->createInputJson($annotation, $path);
                $outputPath = $this->getOutputJsonPath($annotation->id);
                $output = $this->python("{$script} {$inputPath} {$outputPath} {$checkpointPath}");
                $keyframes = json_decode(File::get($outputPath), true);
            } catch (Exception $e) {
                $input = File::get($inputPath);
                throw new Exception("Input: {$input}\n".$e->getMessage());
            } finally {
                if (isset($inputPath)) {
                    $this->maybeDeleteFile($inputPath);
                }

                if (isset($outputPath)) {
                    $this->maybeDeleteFile($outputPath);
                }
            }

            return $keyframes;
        });
    }

    /**
     * Downloads the model checkpoint if they weren't downloaded yet.
     *
     * @param string $from
     * @param string $to
     */
    protected function maybeDownloadCheckpoint($from, $to)
    {
        if (!File::exists($to)) {
            if (!File::exists(dirname($to))) {
                File::makeDirectory(dirname($to), 0700, true, true);
            }
            $success = @copy($from, $to);

            if (!$success) {
                throw new Exception("Failed to download checkpoint from '{$from}'.");
            }
        }
    }

    /**
     * Get the path to to input file for the object tracking script.
     *
     * @param VideoAnnotation $annotation
     *
     * @return string
     */
    protected function getInputJsonPath(VideoAnnotation $annotation)
    {
        return config('videos.tmp_dir')."/object_tracking_input_{$annotation->id}.json";
    }

    /**
     * Create the JSON file that is the input for the object tracking script.
     *
     * @param VideoAnnotation $annotation
     * @param string $videoPath Path to the video file.
     *
     * @return string Path to the JSON file.
     */
    protected function createInputJson(VideoAnnotation $annotation, $videoPath)
    {
        $path = $this->getInputJsonPath($annotation);
        $content = json_encode([
            'video_path' => $videoPath,
            'start_time' => $annotation->frames[0],
            'start_window' => $this->getStartWindow($annotation),
            'keyframe_distance' => config('videos.keyframe_distance'),
        ]);

        File::put($path, $content);

        return $path;
    }

    /**
     * Delete a file if it exists.
     *
     * @param string $path
     */
    protected function maybeDeleteFile($path)
    {
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    /**
     * Get the path to to output file for the object tracking script.
     *
     * @param int $annotationId
     *
     * @return string
     */
    protected function getOutputJsonPath(int $annotationId)
    {
        return config('videos.tmp_dir')."/object_tracking_output_{$annotationId}.json";
    }

    /**
     * Execute a Python script.
     *
     * @param string $command Command to execute.
     *
     * @return string The last line of the stout output.
     */
    protected function python($command)
    {
        $lines = 0;
        $code = 0;
        $python = config('videos.python');

        exec("{$python} -u {$command} 2>&1", $lines, $code);

        if ($code !== 0) {
            throw new Exception("Error while executing Python script with '{$command}':\n".implode("\n", $lines));
        }

        return end($lines);
    }

    /**
     * Get the coordinates and dimensions of the start window for the object tracking
     * script.
     *
     * @param VideoAnnotation $annotation
     *
     * @return array
     */
    protected function getStartWindow(VideoAnnotation $annotation)
    {
        switch ($annotation->shape_id) {
            case Shape::pointId():
                $points = $annotation->points[0];
                $padding = config('videos.tracking_point_padding');

                return [
                    // x
                    $points[0] - $padding,
                    // y
                    $points[1] - $padding,
                    // width
                    $padding * 2,
                    // height
                    $padding * 2,
                ];
            case Shape::circleId():
                $points = $annotation->points[0];

                return [
                    // x
                    $points[0] - $points[2],
                    // y
                    $points[1] - $points[2],
                    // width
                    $points[2] * 2,
                    // height
                    $points[2] * 2,
                ];
            default:
                throw new Exception('Object tracking supports only point annotations for now.');
        }
    }

    /**
     * Get the points of a keyframe depending on the annotation shape.
     *
     * @param VideoAnnotation $annotation
     * @param array $keyframe
     *
     * @return array
     */
    protected function getPointsFromKeyframe(VideoAnnotation $annotation, $keyframe)
    {
        switch ($annotation->shape_id) {
            case Shape::pointId():
                return [$keyframe[1], $keyframe[2]];
            default:
                array_shift($keyframe);
                return $keyframe;
        }
    }

    /**
     * Decrement the count of object tracking jobs.
     */
    protected function decrementCacheValue()
    {
        $count = Cache::decrement(static::getRateLimitCacheKey($this->userId));
        if ($count <= 0) {
            Cache::forget(static::getRateLimitCacheKey($this->userId));
        }
    }
}
