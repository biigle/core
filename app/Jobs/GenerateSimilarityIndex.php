<?php

namespace Biigle\Jobs;


use Biigle\Image;
use Biigle\Jobs\Job;
use Biigle\Volume;
use Storage;
use File;
use Exception;
use Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;


class GenerateSimilarityIndex extends Job implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 2;

    /**
     * Ignore this job if the image does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;


    /**
     * The volume to process
     *
     * @var Volume
     */
    public $volume;

    /**
     * The hash values according to the images in volume
     *
     * @var array
     */
    protected $hashValues;

    /**
     * The similarity values according to the images in volume
     *
     * @var array
     */
    protected $similarityIndices;

    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate process.
     *
     * @return void
     */
    public function __construct(Volume $volume)
    {
        $this->volume = $volume;
        $this->hashValues = [];
        $this->similarityIndices = [];

    }

    /**
     * Execute the job.
     *
     * @return void
     * @throws Exception
     */
    public function handle()
    {
        $collection = $this->volume->images;
        if ($collection->whereNull('hash')->isNotEmpty()) {
            // maybe create a warning in the logs
            return;
        }

        if ($collection->count() <= 1) {
            foreach ($this->volume->images as $image) {
                $image->similarityIndex = 0;
                $image->save();
            }
            return;
        }

        $imageHashArray = $collection->pluck('hash', 'id');
        $similarityIndexArray = $this->createSimilarityIndexArray($imageHashArray);
        if (!is_null($similarityIndexArray)) {
            foreach ($this->volume->images as $image) {
                $id = $image->id;
                $similarityIndex = $similarityIndexArray[$id];
                $image->similarityIndex = $similarityIndex;
                $image->save();
            }
        }
    }

    /**
     * Execute the SimilarityIndexGenerator script for the Volume
     * @throws Exception
     */
    public function createSimilarityIndexArray($imageHashArray)
    {
        try {
            $script = config('biigle.similarity_index_generator');
            $outputPath = $this->getOutputJsonPath($this->volume);
            $inputPath = $this->createInputJson($this->volume, $imageHashArray);
            $output = $this->python("{$script} {$inputPath} {$outputPath}");
            $similarityIndexArray = json_decode(File::get($outputPath), true);
      } catch (Exception $e) {
            $input = File::get($inputPath);
            $similarityIndexArray = null;
            throw new Exception("Input: {$input}\n" . $e->getMessage());
        } finally {
            if (isset($inputPath)) {
                $this->maybeDeleteFile($inputPath);
            }

            if (isset($outputPath)) {
                $this->maybeDeleteFile($outputPath);
            }
        }
        return $similarityIndexArray;

    }

    /**
     * Execute a Python script.
     *
     * @param $command
     * @return string the hash value for the image
     * @throws Exception
     */
    protected function python($command)
    {
        $lines = 0;
        $code = 0;
        $python = config('biigle.python');


        exec("{$python} {$command}", $lines, $code);

        if ($code !== 0) {
            throw new Exception("Error while executing Python script':\n".implode("\n", $lines));
        }

        return end($lines);

    }

    /**
     * Get the path to to input file for the SimilarityIndexGenerator script.
     *
     * @param Volume $volume
     *
     * @return string
     */
    protected function getInputJsonPath(Volume $volume)
    {
        return config('biigle.tmp_dir')."/generate_sim_index_input_{$volume->id}.json";
    }

    /**
     * Get the path to to output file for the SimilarityIndexGenerator script.
     *
     * @param Volume $volume
     *
     * @return string
     */
    protected function getOutputJsonPath(Volume $volume)
    {
        return config('biigle.tmp_dir')."/generate_sim_index_output_{$volume->id}.json";
    }

    /**
     * Create the JSON file that is the input for the SimilarityIndexGenerator script.
     *
     * @param Volume $volume
     * @param array $imagesHashArray
     * @return string Path to the JSON file.
     */
    protected function createInputJson(Volume $volume, $imagesHashArray)
    {
        $path = $this->getInputJsonPath($volume);
        $content = $imagesHashArray->toJson();

        File::put($path, $content);
        return $path;
    }

    /**
     * Delete a file if it exists.
     *
     * @param string $path
     */
    protected function maybeDeleteFile($path)
    {
        if (File::exists($path)) {
            File::delete($path);
        }
    }

}
