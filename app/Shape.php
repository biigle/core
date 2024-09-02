<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A shape, e.g. `point` or `circle`.
 *
 * @method static Shape point()
 * @method static int pointId()
 * @method static Shape line()
 * @method static int lineId()
 * @method static Shape polygon()
 * @method static int polygonId()
 * @method static Shape circle()
 * @method static int circleId()
 * @method static Shape rectangle()
 * @method static int rectangleId()
 * @method static Shape ellipse()
 * @method static int ellipseId()
 * @method static Shape wholeFrame()
 * @method static int wholeFrameId()
 */
class Shape extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array<string, string>
     */
    const INSTANCES = [
        'point' => 'Point',
        'line' => 'LineString',
        'polygon' => 'Polygon',
        'circle' => 'Circle',
        'rectangle' => 'Rectangle',
        'ellipse' => 'Ellipse',
        'wholeFrame' => 'WholeFrame',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
