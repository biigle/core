<?php

namespace Biigle\Jobs;


use Biigle\Image;
use Biigle\Jobs\Job;


class GenerateHashValue extends Job implements ShouldQueue
{

    /**
     * The image to process
     *
     * @var Image
     */
    public $image;

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
     * @param string $path of the image
     *
     * @return string the hash value for the image
     */
    protected function python($path)
    {

    }
}
