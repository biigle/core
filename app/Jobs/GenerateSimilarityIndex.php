<?php

namespace Biigle\Jobs;


use Biigle\Jobs\Job;
use Illuminate\Contracts\Queue\ShouldQueue;


class GenerateSimilarityIndex extends Job implements ShouldQueue
{

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
    protected function python()
    {

    }
}
