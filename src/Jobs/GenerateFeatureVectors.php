<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Jobs\Job;
use Biigle\Modules\Largo\Traits\ComputesAnnotationBox;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use SplFileObject;


abstract class GenerateFeatureVectors extends Job implements ShouldQueue
{
    use ComputesAnnotationBox;

    /**
     * The "radius" of the bounding box around a point annotation.
     *
     * This is half the patch size of 224 that is expected by DINO.
     *
     * @var int
     */
    const POINT_PADDING = 112;

    /**
     * Generate the input for the python script.
     *
     * @param \Illuminate\Support\Collection $annotations
     */
    protected function generateInput(array $images, array $paths, Collection $annotations): array
    {
        $annotations = $annotations->groupBy('image_id');
        $input = [];

        foreach ($images as $index => $image) {
            $path = $paths[$index];
            $imageAnnotations = $annotations[$image->id];
            $boxes = [];
            foreach ($imageAnnotations as $a) {
                $box = $this->getAnnotationBoundingBox($a->points, $a->shape, self::POINT_PADDING);
                $box = $this->makeBoxContained($box, $image->width, $image->height);
                $zeroSize = $box[2] === 0 && $box[3] === 0;

                if (!$zeroSize) {
                    // Convert width and height to "right" and "bottom" coordinates.
                    $box[2] = $box[0] + $box[2];
                    $box[3] = $box[1] + $box[3];

                    $boxes[$a->id] = $box;
                }
            }

            if (!empty($boxes)) {
                $input[$path] = $boxes;
            }
        }

        return $input;
    }

    /**
     * Run the Python command.
     *
     * @param string $command
     */
    protected function python(array $input, string $outputPath)
    {
        $python = config('largo.python');
        $script = config('largo.extract_features_script');
        $inputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_input');
        File::put($inputPath, json_encode($input));
        try {
            $result = Process::forever()
                ->env(['TORCH_HOME' => config('largo.torch_hub_path')])
                ->run("{$python} -u {$script} {$inputPath} {$outputPath}")
                ->throw();
        } finally {
            File::delete($inputPath);
        }
    }

    /**
     * Generator to read the output CSV row by row.
     */
    protected function readOuputCsv(string $path): \Generator
    {
        $file = new SplFileObject($path);
        while (!$file->eof()) {
            $csv = $file->fgetcsv();
            if (count($csv) === 2) {
                yield $csv;
            }
        }
    }
}
