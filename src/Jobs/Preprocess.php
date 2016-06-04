<?php

namespace Dias\Modules\Ate\Jobs;

use Mail;
use DB;
use Dias\Jobs\Job;
use Dias\Transect;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class Preprocess extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The transect which should be preprocessed.
     *
     * @var transect
     */
    private $transect;

    /**
     * Create a new job instance.
     *
     * @param Transect $transect The transect which should be preprocessed.
     *
     * @return void
     */
    public function __construct(Transect $transect)
    {
        $this->transect= $transect;
    
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        DB::reconnect();
        $path = uniqid("/tmp/");
        mkdir($path);
        chmod($path,0777);
        $points = DB::select("copy (select annotations.id,transects.url||'/'||images.filename, annotations.points from images,transects,annotations left join patches on annotations.id = patches.annotation_id where patches.annotation_id is NULL and annotations.image_id = images.id and images.transect_id = transects.id and transects.id=".$this->transect->id.") to '".$path."/points.csv' csv");
        $cmd = $path."/points.csv ".$this->transect->id." ".storage_path();
        var_dump($cmd);
        $ret = system('/usr/bin/python '.__DIR__.'/../Scripts/preprocess.py '.$cmd);
    }
}