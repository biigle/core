<?php

namespace Dias\Observers;

use Event;
use Exception;
use Dias\Transect;

class TransectObserver
{
    /**
     * A transect must not be created without having a creator.
     *
     * @param Transect $transect
     * @return bool
     */
    public function creating(Transect $transect)
    {
        if ($transect->creator === null) {
            throw new Exception('Transect creator must not be null when creating a new transect.');
        }

        return true;
    }

    /**
     * Handle the deletion of a transect
     *
     * @param Transect $transect
     * @return bool
     */
    public function deleting(Transect $transect)
    {
        Event::fire('images.cleanup', [$transect->images()->pluck('uuid')->toArray()]);

        return true;
    }
}
