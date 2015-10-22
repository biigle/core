<?php

namespace Dias\Observers;

use Exception;
use Dias\Jobs\GenerateThumbnails;
use Queue;

class TransectObserver
{
    /**
     * A transect must not be created without having a creator.
     *
     * @param \Dias\Transect $transect
     * @return bool
     */
    public function creating($transect)
    {
        if ($transect->creator === null) {
            throw new Exception('Transect creator must not be null when creating a new transect.');
        }

        return true;
    }

    /**
     * Dispatches the job to generate thumbnails for the transect
     *
     * @param \Copria\SubmittedJob $transect The created transect
     */
    public function created($transect)
    {
        Queue::push(new GenerateThumbnails($transect));
    }
}
