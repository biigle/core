<?php

namespace Biigle\Observers;

use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;
use Biigle\Events\VideosDeleted;
use Biigle\Report;
use Biigle\Volume;
use Exception;

class VolumeObserver
{
    /**
     * A volume must not be created without having a creator.
     *
     * @param Volume $volume
     *
     */
    public function creating(Volume $volume)
    {
        if ($volume->creator_id === null) {
            throw new Exception('Volume creator must not be null when creating a new volume.');
        }
    }

    /**
     * Handle the deletion of a volume.
     *
     * @param Volume $volume
     *
     */
    public function deleting(Volume $volume)
    {
        $uuids = $volume->images()->pluck('uuid')->toArray();
        if (!empty($uuids)) {
            event(new ImagesDeleted($uuids));
        }

        $uuids = $volume->images()->where('tiled', true)->pluck('uuid')->toArray();
        if (!empty($uuids)) {
            event(new TiledImagesDeleted($uuids));
        }

        $uuids = $volume->videos()->pluck('uuid')->toArray();
        if (!empty($uuids)) {
            event(new VideosDeleted($uuids));
        }

        $volume->deleteMetadata(true);
    }

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
