<?php

namespace Biigle\Events;

use Biigle\Volume;
use Illuminate\Foundation\Events\Dispatchable;

class VolumeCloned
{
    use Dispatchable;

    public function __construct(public Volume $volume)
    {
        //
    }
}
