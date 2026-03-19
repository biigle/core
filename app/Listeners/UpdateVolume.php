<?php

namespace Biigle\Listeners;

use Biigle\Events\VolumeFilesProcessed;
use Biigle\Volume;

class UpdateVolume
{
    /**
     * Handle the event.
     */
    public function handle(VolumeFilesProcessed $event): void
    {
        if (!$event->isLastEvent) {
            return;
        }

        $volume = Volume::where('id', $event->volumeId)->first();
        if ($volume?->creating_async) {
            $volume->creating_async = false;
            $volume->save();
        }
    }
}
