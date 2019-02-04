<?php

namespace Biigle\Modules\Videos\Jobs;

use File;
use Storage;
use Exception;
use Biigle\Shape;
use Biigle\Jobs\Job;
use League\Flysystem\Adapter\Local;
use Illuminate\Queue\SerializesModels;
use Biigle\Modules\Videos\VideoAnnotation;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Attempts to track an obect in a video. The object is initially defined by a video
 * annotation. The annotation will be updated with the positions determined with the
 * object tracking method.
 */
class TrackObject extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * The annotation that defines the initial object to track.
     *
     * @var VideoAnnotation
     */
    protected $annotation;

    /**
     * Create a new instance.
     *
     * @param VideoAnnotation $annotation The annotation that defines the initial object to track.
     */
    public function __construct(VideoAnnotation $annotation)
    {
        $this->annotation = $annotation;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $keyframes = $this->getTrackingKeyframes($this->annotation);
        $frames = $this->annotation->frames;
        $points = $this->annotation->points;

        foreach ($keyframes as $keyframe) {
            $frames[] = array_shift($keyframe);
            $points[] = $keyframe;
        }

        $this->annotation->frames = $frames;
        $this->annotation->points = $points;
        $this->annotation->save();
    }

    /**
     * The job failed to process.
     *
     * @param  Exception  $exception
     * @return void
     */
    public function failed(Exception $exception)
    {
        $this->annotation->delete();
        throw $exception;
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
        $script = config('videos.object_tracker_script');

        try {
            $inputPath = $this->createInputJson($annotation);
            $outputPath = $this->getOutputJsonPath($annotation);
            $output = $this->python("{$script} {$inputPath} {$outputPath}");
            // TODO parse keyframe array depending on shape. Array contains [x, y, w, h].
            // Set negative values to 0.
            $keyframes = json_decode(File::get($outputPath), true);
        } finally {
            if (isset($inputPath)) {
                $this->maybeDeleteFile($inputPath);
            }

            if (isset($outputPath)) {
                $this->maybeDeleteFile($outputPath);
            }
        }

        return $keyframes;
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
     *
     * @return string Path to the file.
     */
    protected function createInputJson(VideoAnnotation $annotation)
    {
        $path = $this->getInputJsonPath($annotation);
        $content = json_encode([
            'video_path' => $this->getVideoPath($annotation),
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
     * @param string path
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
     * @param VideoAnnotation $annotation
     *
     * @return string
     */
    protected function getOutputJsonPath(VideoAnnotation $annotation)
    {
        return config('videos.tmp_dir')."/object_tracking_output_{$annotation->id}.json";
    }

    /**
     * Execute a Python script.
     *
     * @param string $command Command to execute.
     *
     * @return The last line of the stout output.
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
     * Get the file path to the video of an annotation.
     *
     * @param VideoAnnotation $annotation
     *
     * @return string
     */
    protected function getVideoPath(VideoAnnotation $annotation)
    {
        $video = $annotation->video;
        $adapter = Storage::disk($video->disk)->getAdapter();

        if ($adapter instanceof Local) {
            return $adapter->applyPathPrefix($video->path);
        }

        throw new Exception('Object tracking supports only locally stored videos for now.');
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
        if ($annotation->shape_id !== Shape::pointId()) {
            throw new Exception('Object tracking supports only point annotations for now.');
        }

        $points = $annotation->points[0];

        // Center a 100x100 px window around the point. [x, y, w, h].
        $width = 100;
        return [$points[0] - $width/2, $points[1] - $width/2, $width, $width];
    }
}
