<?php

namespace Biigle\Events;

use Illuminate\Foundation\Events\Dispatchable;

class ImagesDeleted
{
    use Dispatchable;

    /**
     * UUIDs of deleted images.
     *
     * @var array
     */
    public $uuids;

    /**
     * Create a new event instance.
     *
     * @param string|array $uuids UUIDs of the deleted images.
     * @return void
     */
    public function __construct($uuids)
    {
        if (!is_array($uuids)) {
            $uuids = [$uuids];
        }

        $this->uuids = $uuids;
    }
}
