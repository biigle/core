<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Database\Eloquent\Builder;
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
        $annotations = ImageAnnotation::where('image_id', $file->id)->get();

        $image = $this->getVipsImage($path);
        $annotations->each(function ($a) use ($image) {
            $buffer = $this->getAnnotationPatch($image, $a->getPoints(), $a->getShape());
            $targetPath = self::getTargetPath($a);
            Storage::disk($this->targetDisk)->put($targetPath, $buffer);
        });

        $this->generateFeatureVectors($annotations, $path);
    }

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    protected function updateOrCreateFeatureVector(array $id, array $attributes): void
    {
        ImageAnnotationLabelFeatureVector::updateOrCreate($id, $attributes);
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
