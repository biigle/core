<?php

namespace Biigle\Observers;

use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;
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
        event(new ImagesDeleted($volume->images()->pluck('uuid')->toArray()));

        $uuids = $volume->images()->where('tiled', true)->pluck('uuid')->toArray();
        if (!empty($uuids)) {
            event(new TiledImagesDeleted($uuids));
        }

        return true;
    }
}
