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
use Jcupitt\Vips\Image as VipsImage;

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
     * {@inheritdoc}
     */
    protected function generateFeatureVectors(Collection $annotations, array|string $filePath): void
    {
        // Tiled images cannot be processed directly. Instead, a crop has to be
        // generated for each annotation.
        if (!$this->file->tiled) {
            parent::generateFeatureVectors($annotations, $filePath);
            return;
        }

        $boxes = $this->generateFileInput($this->file, $annotations);

        if (empty($boxes)) {
            return;
        }

        $inputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_input');
        $outputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_output');
        $tmpFiles = [$inputPath, $outputPath];

        try {
            $input = [];
            $options = [];
            // Optimize for extracting only a single patch.
            if ($annotations->count() === 1) {
                $options['access'] = 'sequential';
            }
            $image = $this->getVipsImage($filePath, $options);

            foreach ($boxes as $id => $box) {
                // Convert right and bottom back to width and height.
                $box[2] -= $box[0];
                $box[3] -= $box[1];

                $path = tempnam(sys_get_temp_dir(), 'largo_feature_vector_patch');
                $tmpFiles[] = $path;
                $image->crop(...$box)->pngsave($path);

                $input[$path] = [$id => [0, 0, $box[2], $box[3]]];
            }

            File::put($inputPath, json_encode($input));
            $this->python($inputPath, $outputPath);
            $output = $this->readOutputCsv($outputPath);
            $this->updateOrCreateFeatureVectors($annotations, $output);
        } finally {
            File::delete($tmpFiles);
        }
    }

    /**
     * Get the vips image instance.
     */
    protected function getVipsImage(string $path, array $options = [])
    {
        // Must not use sequential access because multiple patches could be extracted.
        return VipsImage::newFromFile($path, $options);
    }

    /**
     * {@inheritdoc}
     */
    protected function getAnnotationQuery(VolumeFile $file): Builder
    {
        return ImageAnnotation::where('image_id', $file->id)->when(
            !empty($this->only),
            fn ($q) => $q->whereIn('id', $this->only)
        );
    }
}
