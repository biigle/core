<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use VipsImage;

class GenerateImageAnnotationPatch extends GenerateAnnotationPatch
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // Do not get the path in the constructor because that would require fetching all
        // the images of the annotations. This would be really slow when lots of
        // annotation patchs should be generated.
        $targetPath = self::getTargetPath($this->annotation);
        $image = $this->getVipsImage($path);

        $buffer = $this->getAnnotationPatch($image, $this->annotation->getPoints(), $this->annotation->getShape());

        Storage::disk($this->targetDisk)->put($targetPath, $buffer);

        $this->generateFeatureVector($file, $path);
    }

    /**
     * Get a query for the feature vectors associated with the annotation of this job.
     */
    protected function getFeatureVectorQuery(): Builder
    {
        return ImageAnnotationLabelFeatureVector::where('annotation_id', $this->annotation->id);
    }

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    protected function createFeatureVector(array $attributes): void
    {
        ImageAnnotationLabelFeatureVector::create($attributes);
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
        return VipsImage::newFromFile($path, ['access' => 'sequential']);
    }
}
