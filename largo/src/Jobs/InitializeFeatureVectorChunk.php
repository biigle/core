<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Annotation;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToReadFile;

class InitializeFeatureVectorChunk extends GenerateFeatureVectors
{
    use InteractsWithQueue;

    public function __construct(
        public array $imageAnnotationIds,
        public array $videoAnnotationIds
    )
    {
        //
    }

    public function handle()
    {
        $skipIds = ImageAnnotationLabelFeatureVector::whereIn('annotation_id', $this->imageAnnotationIds)
            ->distinct()
            ->pluck('annotation_id')
            ->toArray();

        $ids = array_diff($this->imageAnnotationIds, $skipIds);
        $models = ImageAnnotation::whereIn('id', $ids)
            ->with('file', 'labels.label', 'shape')
            ->get()
            ->keyBy('id');

        // Chunk to avoid maximum insert parameter limit.
        $this->getInsertData($models)->chunk(10000)->each(fn ($chunk) =>
            ImageAnnotationLabelFeatureVector::insert($chunk->toArray())
        );

        $skipIds = VideoAnnotationLabelFeatureVector::whereIn('annotation_id', $this->videoAnnotationIds)
            ->distinct()
            ->pluck('annotation_id')
            ->toArray();

        $ids = array_diff($this->videoAnnotationIds, $skipIds);
        $models = VideoAnnotation::whereIn('id', $ids)
            ->with('file', 'labels.label')
            ->get()
            ->keyBy('id');

        // Chunk to avoid maximum insert parameter limit.
        $this->getInsertData($models)->chunk(10000)->each(fn ($chunk) =>
            VideoAnnotationLabelFeatureVector::insert($chunk->toArray())
        );
    }

    /**
     * Get the array to insert new feature vector models into the DB.
     */
    public function getInsertData(Collection $models): Collection
    {
        $insert = collect([]);

        $outputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_output');

        try {
            foreach ($this->getFeatureVectors($models, $outputPath) as $row) {
                $annotation = $models->get($row[0]);
                $vector = $row[1];
                $i = $annotation->labels
                    ->map(fn ($annotationLabel) => [
                        'id' => $annotationLabel->id,
                        'annotation_id' => $annotation->id,
                        'label_id' => $annotationLabel->label_id,
                        'label_tree_id' => $annotationLabel->label->label_tree_id,
                        'volume_id' => $annotation->file->volume_id,
                        'vector' => $vector,
                    ]);
                $insert = $insert->concat($i);
            }
        } finally {
            File::delete($outputPath);
        }

        return $insert;
    }

    /**
     * Generate feature vectors from the thumbnails of many annotations.
     *
     * @param Collection $models Annotation models
     * @param string $outputPath Path to stroe the CSV file with feature vectors
     */
    public function getFeatureVectors(Collection $models, string $outputPath): \Generator
    {
        if ($models->isEmpty()) {
            return (fn () => yield from [])();
        }

        $disk = Storage::disk(config('largo.patch_storage_disk'));
        $rect = [0, 0, config('thumbnails.width'), config('thumbnails.height')];
        $paths = [];

        try {
            $input = [];
            foreach ($models as $a) {
                $srcPath = ProcessAnnotatedFile::getTargetPath($a);
                $tmpPath = tempnam(sys_get_temp_dir(), '');

                try {
                    $thumbnail = $disk->get($srcPath);
                } catch (UnableToReadFile $e) {
                    continue;
                }

                if (is_null($thumbnail)) {
                    continue;
                }

                File::put($tmpPath, $thumbnail);
                $paths[] = $tmpPath;

                // Compute the annotation outlines in "thumbnail space".
                $padding = config('largo.patch_padding');
                $pointPadding = config('largo.point_padding');
                $thumbWidth = config('thumbnails.width');
                $thumbHeight = config('thumbnails.height');

                if ($a->shape_id === Shape::wholeFrameId()) {
                    $input[$tmpPath] = [$a->id => [0, 0, $thumbWidth, $thumbHeight]];
                    continue;
                }

                if ($a instanceof VideoAnnotation) {
                    $points = $a->points[0];
                } else {
                    $points = $a->points;
                }

                // First determine the box of the thumbnail to get the position and scale
                // factor.
                $box = $this->getAnnotationBoundingBox($points, $a->shape, $pointPadding, $padding);
                $box = $this->ensureBoxAspectRatio($box, $thumbWidth, $thumbHeight);
                $box = $this->makeBoxContained($box, $a->file->width, $a->file->height);
                $x = $box[0];
                $y = $box[1];
                $scale = floatval($thumbWidth) / $box[2];

                // The get the box of the annotation.
                $box = $this->getAnnotationBoundingBox($points, $a->shape, $pointPadding, $padding);
                $box = $this->makeBoxContained($box, $a->file->width, $a->file->height);
                // Make coordinates relative to thumbnail box.
                $box[0] -= $x;
                $box[1] -= $y;
                // Than scale coordinates to "thumbnail space".
                $box = array_map(fn ($v) => $v * $scale, $box);
                $box = $this->makeBoxIntegers($box);

                $zeroSize = $box[2] === 0 && $box[3] === 0;

                if ($zeroSize) {
                    continue;
                }
                // Convert width and height to "right" and "bottom" coordinates.
                $box[2] = $box[0] + $box[2];
                $box[3] = $box[1] + $box[3];

                $input[$tmpPath] = [$a->id => $box];
            }

            if (empty($input)) {
                return (fn () => yield from [])();
            }

            $inputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_input');

            File::put($inputPath, json_encode($input));
            $paths[] = $inputPath;

            $this->python($inputPath, $outputPath);
        } finally {
            File::delete($paths);
        }

        return $this->readOutputCsv($outputPath);
    }
}
