<?php

namespace Dias\Modules\Ate\Jobs;

use Mail;
use DB;
use File;
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

        $csv = uniqid(config('ate.tmp_path').'/').'.csv';

        $query = <<<EOT
COPY (
    SELECT annotations.id, transects.url||'/'||images.filename, annotations.points
    FROM images, transects, annotations
            WHERE annotations.image_id = images.id
                AND images.transect_id = transects.id
                AND transects.id = {$this->transect->id}
) TO '{$csv}' csv;
EOT;

        DB::statement($query);

        $patchDestination = config('ate.patch_storage');
        $dictDestination = config('ate.dict_storage').'/'.$this->transect->id.'.npy';

        system(
            config('ate.python').' '.
            config('ate.preprocess_script').' '.
            // exported source file
            $csv.' '.
            // target directory for the annotation patch files
            config('ate.patch_storage').'/'.$this->transect->id.'/ '.
            // source/target path for the transect dict file
            config('ate.dict_storage').'/'.$this->transect->id.'.npy'
        );

        File::delete($csv);
    }
}
