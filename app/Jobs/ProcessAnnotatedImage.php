<?php

namespace Biigle\Jobs;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image;

/**
 * @extends ProcessAnnotatedFile<ImageAnnotation>
 */
class ProcessAnnotatedImage extends ProcessAnnotatedFile
{
    /**
     * {@inheritdoc}
     */
    public function handleFile(VolumeFile $file, $path)
    {
        if (!$this->skipPatches) {
            $options = [];
            // Optimize for extracting only a single patch.
            if (count($this->only) === 1) {
                $options['access'] = 'sequential';
            }
            $image = $this->getVipsImage($path, $options);
        } else {
            $image = null;
        }

        $this->getAnnotationQuery()
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
     * {@inheritdoc}
     */
    protected function getFeatureVectorModel(): string
    {
        return ImageAnnotationLabelFeatureVector::class;
    }

    /**
     * Get the vips image instance.
     */
    protected function getVipsImage(string $path, array $options = [])
    {
        // Must not use sequential access because multiple patches could be extracted.
        return Image::newFromFile($path, $options);
    }

    /**
     * {@inheritdoc}
     *
     * @return Builder<ImageAnnotation>
     */
    protected function getBaseAnnotationQuery(): Builder
    {
        return ImageAnnotation::where('image_id', $this->file->id);
    }
}
