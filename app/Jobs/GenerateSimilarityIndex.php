<?php

namespace Biigle\Jobs;


use Biigle\Jobs\Job;
use Biigle\Volume;
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
     * The image to process
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
     */
    public function handle()
    {

    }

    /**
     * Execute a Python script.
     *
     * @param
     *
     * @return
     */
    protected function python($inputPath, $outputPath)
    {
        $lines = 0;
        $code = 0;

        exec("python3 {$inputPath} {$outputPath}", $lines, $code);

        if ($code !== 0) {
            throw new Exception("Error while executing Python script':\n".implode("\n", $lines));
        }

        return end($lines);


    }
}
