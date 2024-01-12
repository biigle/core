<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Annotation;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

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
        $outputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_output');

        try {
            $skipIds = ImageAnnotationLabelFeatureVector::whereIn('annotation_id', $this->imageAnnotationIds)
                ->distinct()
                ->pluck('annotation_id')
                ->toArray();

            $ids = array_diff($this->imageAnnotationIds, $skipIds);
            $models = ImageAnnotation::whereIn('id', $ids)
                ->with('image', 'labels.label')
                ->get()
                ->keyBy('id');

            $insert = collect([]);

            foreach ($this->getFeatureVectors($models, $outputPath) as $row) {
                $annotation = $models->get($row[0]);
                $vector = $row[1];
                $i = $annotation->labels
                    ->map(fn ($annotationLabel) => [
                        'id' => $annotationLabel->id,
                        'annotation_id' => $annotation->id,
                        'label_id' => $annotationLabel->label_id,
                        'label_tree_id' => $annotationLabel->label->label_tree_id,
                        'volume_id' => $annotation->image->volume_id,
                        'vector' => $vector,
                    ]);
                $insert = $insert->concat($i);
            }

            // Chunk to avoid maximum insert parameter limit.
            $insert->chunk(10000)->each(fn ($chunk) =>
                ImageAnnotationLabelFeatureVector::insert($chunk->toArray())
            );


            $skipIds = VideoAnnotationLabelFeatureVector::whereIn('annotation_id', $this->videoAnnotationIds)
                ->distinct()
                ->pluck('annotation_id')
                ->toArray();

            $ids = array_diff($this->videoAnnotationIds, $skipIds);
            $models = VideoAnnotation::whereIn('id', $ids)
                ->with('video', 'labels.label')
                ->get()
                ->keyBy('id');

            $insert = collect([]);

            foreach ($this->getFeatureVectors($models, $outputPath) as $row) {
                $annotation = $models->get($row[0]);
                $vector = $row[1];
                $i = $annotation->labels
                    ->map(fn ($annotationLabel) => [
                        'id' => $annotationLabel->id,
                        'annotation_id' => $annotation->id,
                        'label_id' => $annotationLabel->label_id,
                        'label_tree_id' => $annotationLabel->label->label_tree_id,
                        'volume_id' => $annotation->video->volume_id,
                        'vector' => $vector,
                    ]);
                $insert = $insert->concat($i);
            }

            // Chunk to avoid maximum insert parameter limit.
            $insert->chunk(10000)->each(fn ($chunk) =>
                VideoAnnotationLabelFeatureVector::insert($chunk->toArray())
            );
        } finally {
            File::delete($outputPath);
        }
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
            $input = $models->mapWithKeys(function (Annotation $a) use ($disk, $rect, &$paths) {
                $srcPath = GenerateAnnotationPatch::getTargetPath($a);
                $tmpPath = tempnam(sys_get_temp_dir(), '').'.'.config('largo.patch_format');

                $thumbnail = $disk->get($srcPath);
                if (is_null($thumbnail)) {
                    return [];
                }

                File::put($tmpPath, $thumbnail);
                $paths[] = $tmpPath;

                return [$tmpPath => [$a->id => $rect]];
            });

            if ($input->isEmpty()) {
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
