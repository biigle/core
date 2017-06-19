<?php

namespace Biigle\Modules\Export\Observers;

use Biigle\Volume;
use Biigle\Modules\Export\Report;

class VolumeObserver
{
    /**
     * Update the source name of reports when the source is deleted.
     *
     * @param \Biigle\Volume $volume
     */
    public function deleted($volume)
    {
        Report::where('source_id', '=', $volume->id)
            ->where('source_type', '=', Volume::class)
            ->update([
                'source_name' => $volume->name,
            ]);
    }
}
