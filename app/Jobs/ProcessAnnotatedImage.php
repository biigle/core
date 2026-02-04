<?php

namespace Biigle\Jobs;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image;

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

        $this->getAnnotationQuery($file)
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
     *
     * @param Collection<int, ImageAnnotation> $annotations
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
    protected function getAnnotationQuery(VolumeFile $file): Builder
    {
        return ImageAnnotation::where('image_id', $file->id)->when(
            !empty($this->only),
            fn ($q) => $q->whereIn('id', $this->only)
        );
    }
}
