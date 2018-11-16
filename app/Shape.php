<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Model;

/**
 * A shape, e.g. `point` or `circle`.
 */
class Shape extends Model
{
    use HasConstantInstances;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        'point' => 'Point',
        'line' => 'LineString',
        'polygon' => 'Polygon',
        'circle' => 'Circle',
        'rectangle' => 'Rectangle',
        'ellipse' => 'Ellipse',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
