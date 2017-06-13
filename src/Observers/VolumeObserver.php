<?php

namespace Biigle\Modules\Export\Observers;

use Biigle\Volume;
use Biigle\Modules\Export\Report;

class VolumeObserver
{
    /**
     * Remove association to reports of this volume.
     *
     * @param \Biigle\Volume $volume
     */
    public function deleted($volume)
    {
        Report::where('source_id', '=', $volume->id)
            ->where('source_type', '=', Volume::class)
            ->update([
                'source_id' => null,
                'source_type' => null,
            ]);
    }
}
