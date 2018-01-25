<?php

namespace Biigle\Observers;

use Event;
use Exception;
use Biigle\Role;
use Biigle\Volume;

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
        if ($volume->creator === null) {
            throw new Exception('Volume creator must not be null when creating a new volume.');
        }

        return true;
    }

    /**
     * Handle actions for newly created volumes.
     *
     * @param Volume $volume
     * @return void
     */
    public function created($volume)
    {
        $volume->addMember($volume->creator, Role::$admin);
    }

    /**
     * Handle the deletion of a volume.
     *
     * @param Volume $volume
     * @return bool
     */
    public function deleting(Volume $volume)
    {
        Event::fire('images.cleanup', [$volume->images()->pluck('uuid')->toArray()]);

        return true;
    }
}
