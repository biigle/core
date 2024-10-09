<?php

namespace Biigle\Observers;

use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;
use Biigle\Events\VideosDeleted;
use Biigle\Volume;
use Exception;

class VolumeObserver
{
    /**
     * A volume must not be created without having a creator.
     *
     * @param Volume $volume
     * @return bool
     */
    public function creating(Volume $volume)
    {
        if ($volume->creator_id === null) {
            throw new Exception('Volume creator must not be null when creating a new volume.');
        }

        return true;
    }

    /**
     * Handle the deletion of a volume.
     *
     * @param Volume $volume
     * @return bool
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

        return true;
    }
}
