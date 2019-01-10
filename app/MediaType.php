<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Model;

/**
 * Volumes can contain different types of image-series. One type would
 * be a time-series of a static camera taking photos in regular intervals
 * for example. Another type coud be images from a moving camera.
 */
class MediaType extends Model
{
    use HasConstantInstances;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        'timeSeries' => 'time-series',
        'locationSeries' => 'location-series',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
