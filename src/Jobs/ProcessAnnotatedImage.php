<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use VipsImage;

class ProcessAnnotatedImage extends ProcessAnnotatedFile
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        if (!$this->skipPatches) {
            $image = $this->getVipsImage($path);
        } else {
            $image = null;
        }

        $this->getAnnotationQuery($file)
            ->when(!empty($this->only), fn ($q) => $q->whereIn('id', $this->only))
            ->chunkById(1000, function ($annotations) use ($image, $path) {
                if (!$this->skipPatches) {
                    $annotations->each(function ($a) use ($image) {
                        $buffer = $this->getAnnotationPatch(
                            $image,
                            $a->getPoints(),
                            $a->getShape()
                        );
                        $targetPath = self::getTargetPath($a);
                        Storage::disk($this->targetDisk)->put($targetPath, $buffer);
                    });
                }

                if (!$this->skipFeatureVectors) {
                    $this->generateFeatureVectors($annotations, $path);
                }
            });
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
                ImageAnnotationLabelFeatureVector::updateOrCreate(
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
     * Get the vips image instance.
     *
     * @param string $path
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage($path)
    {
        // Must not use sequential access because multiple patches could be extracted.
        return VipsImage::newFromFile($path);
    }

    /**
     * Get the query builder for the annotations.
     *
     * This can be used to extend this class and process different models than image
     * annotations.
     */
    protected function getAnnotationQuery(VolumeFile $file): Builder
    {
        return ImageAnnotation::where('image_id', $file->id);
    }
}
