<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use FFMpeg\Media\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use VipsImage;

class ProcessAnnotatedVideo extends ProcessAnnotatedFile
{
    /**
     * {@inheritdoc}
     */
    public function handleFile(VolumeFile $file, $path)
    {
        $video = $this->getVideo($path);
        $this->getAnnotationQuery($file)->chunkById(
            1000,
            fn ($a) => $this->processAnnotationChunk($a, $video)
        );
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
                $videoFrame = $this->getVideoFrame($video, $frame);

                if (!$this->skipPatches) {
                    $buffer = $this->getAnnotationPatch($videoFrame, $points, $a->shape);
                    $targetPath = self::getTargetPath($a);
                    Storage::disk($this->targetDisk)->put($targetPath, $buffer);
                }

                if (!$this->skipFeatureVectors && !array_key_exists("{$frame}", $frameFiles)) {
                    $framePath = tempnam(sys_get_temp_dir(), 'largo_video_frame').'.png';
                    $videoFrame->writeToFile($framePath);
                    $frameFiles["{$frame}"] = $framePath;
                }
            }

            if (!$this->skipFeatureVectors) {
                $annotationFrames = $annotations->mapWithKeys(
                        fn ($a) => [$a->id => $frameFiles["{$a->frames[0]}"]]
                    )
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
    protected function getVideoFrame(Video $video, float $time, int $trySeek = 30)
    {
        // Sometimes an annotation is near the end of the video (or exactly at the end).
        // FFMpeg often returns an empty buffer in this case. If there is an empty frame,
        // we try to seek backwards one frame until the buffer is not empty or the number
        // of tries is exceeded.
        do {
            $buffer = $video->frame(TimeCode::fromSeconds($time))
                ->save(null, false, true);
            $trySeek -= 1;
            // Roughly estimated framerate of 30 fps. With 30 iterations, we seek back up
            // to 1 s.
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
