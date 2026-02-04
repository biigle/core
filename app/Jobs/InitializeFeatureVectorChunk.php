<?php

namespace Biigle\Jobs;

use Biigle\Annotation;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Exception;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Exception as VipsException;
use Jcupitt\Vips\Image;
use League\Flysystem\UnableToReadFile;

class InitializeFeatureVectorChunk extends GenerateFeatureVectors
{
    use InteractsWithQueue;

    public function __construct(
        public array $imageAnnotationIds,
        public array $videoAnnotationIds
    ) {
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
        $this->getInsertData($models)->chunk(10000)->each(
            fn ($chunk) =>
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
        $this->getInsertData($models)->chunk(10000)->each(
            fn ($chunk) =>
            VideoAnnotationLabelFeatureVector::insert($chunk->toArray())
        );
    }

    /**
     * Get the array to insert new feature vector models into the DB.
     */
    public function getInsertData(Collection $models): Collection
    {
        $insert = collect([]);

        foreach ($this->getFeatureVectors($models) as $row) {
            $annotation = $models->get($row[0]);
            $vector = json_encode($row[1]);
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

        return $insert;
    }

    /**
     * Generate feature vectors from the thumbnails of many annotations.
     *
     * @param Collection $models Annotation models
     */
    public function getFeatureVectors(Collection $models): \Generator
    {
        if ($models->isEmpty()) {
            return (fn () => yield from [])();
        }

        $disk = Storage::disk(config('largo.patch_storage_disk'));
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');
        $padding = config('largo.patch_padding');
        $pointPadding = config('largo.point_padding');

        foreach ($models as $a) {
            $srcPath = ProcessAnnotatedFile::getTargetPath($a);

            // Get the thumbnail from storage.
            try {
                $thumbnail = $disk->get($srcPath);
            } catch (UnableToReadFile $e) {
                continue;
            }

            if (is_null($thumbnail)) {
                continue;
            }

            $image = $this->getVipsImageForPyworker($thumbnail);

            // Compute the crop box for the annotation within the thumbnail.
            if ($a->shape_id === Shape::wholeFrameId()) {
                $box = [0, 0, $thumbWidth, $thumbHeight];
            } else {
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

                // Then get the box of the annotation.
                $box = $this->getAnnotationBoundingBox($points, $a->shape, $pointPadding, $padding);
                $box = $this->makeBoxContained($box, $a->file->width, $a->file->height);
                // Make coordinates relative to thumbnail box.
                $box[0] -= $x;
                $box[1] -= $y;
                // Scale coordinates to "thumbnail space".
                $box = array_map(fn ($v) => $v * $scale, $box);
                $box = $this->makeBoxIntegers($box);

                if ($box[2] === 0 || $box[3] === 0) {
                    continue;
                }
            }

            try {
                $buffer = $this->getCropBufferForPyworker($image, $box);
            } catch (VipsException $e) {
                // Sometimes Vips can't write the crop because the image is corrupt.
                // This annotation will be skipped.
                continue;
            }

            $featureVector = $this->sendPyworkerRequest($buffer);
            yield [$a->id, $featureVector];
        }
    }

    /**
     * Get the vips image instance for submission to the Python worker for feature
     * vectors.
     */
    protected function getVipsImageForPyworker(string $buffer)
    {
        // Make sure the image is in RGB format before sending it to the pyworker.
        $image = VipsImage::newFromBuffer($buffer)->colourspace('srgb');
        if ($image->hasAlpha()) {
            $image = $image->flatten();
        }

        return $image;
    }
}
