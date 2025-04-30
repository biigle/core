<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\Exception\RuntimeException;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Exception as VipsException;
use Jcupitt\Vips\Image as VipsImage;

class ProcessAnnotatedVideo extends ProcessAnnotatedFile
{
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
        $this->getAnnotationQuery($file)
            ->chunkById(100, fn ($a) => $this->processAnnotationChunk($a, $video));
    }

    /**
     * Process a chunk of annotations of this job's file.
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
                    )
                    ->filter()
                    ->toArray();

                $this->generateFeatureVectors($annotations, $annotationFrames);
            }
        } finally {
            File::delete(array_values($frameFiles));
        }
    }

    /**
     * Create the feature vectors based on the Python script output.
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
     * @param int $trySeek
     *
     * @return \Jcupitt\Vips\Video
     */
    protected function getVideoFrame(Video $video, float $time, int $trySeek = 60)
    {
        // Sometimes an annotation is near the end of the video (or exactly at the end).
        // FFMpeg often returns an empty buffer in this case. If there is an empty frame,
        // we try to seek backwards one frame until the buffer is not empty or the number
        // of tries is exceeded.
        do {
            $buffer = $video->frame(TimeCode::fromSeconds($time))
                ->save(null, false, true);
            $trySeek -= 1;
            // Roughly estimated framerate of 30 fps. With 60 iterations, we seek back up
            // to 2 s by default (this is based on what was required for edge cases in
            //  1.5 M annotations on 16k videos).
            $time = max(0, $time - 0.033333333);
        } while (empty($buffer) && $trySeek > 0);

        return VipsImage::newFromBuffer($buffer);
    }

    /**
     * {@inheritdoc}
     */
    protected function getAnnotationQuery(VolumeFile $file): Builder
    {
        return VideoAnnotation::where('video_id', $file->id)->when(
            !empty($this->only),
            fn ($q) => $q->whereIn('id', $this->only)
        );;
    }
}
