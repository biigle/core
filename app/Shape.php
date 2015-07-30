<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

/**
 * A shape, e.g. `point` or `circle`.
 */
class Shape extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The point shape ID.
     *
     * @var int
     */
    public static $pointId;

    /**
     * The line shape ID.
     *
     * @var int
     */
    public static $lineId;

    /**
     * The polygon shape ID.
     *
     * @var int
     */
    public static $polygonId;

    /**
     * The circle shape ID.
     *
     * @var int
     */
    public static $circleId;

    /**
     * The rectangle shape ID.
     *
     * @var int
     */
    public static $rectangleId;
}

Shape::$pointId = Cache::rememberForever('shape-point', function () {
    return Shape::whereName('Point')->first()->id;
});

Shape::$lineId = Cache::rememberForever('shape-line', function () {
    return Shape::whereName('LineString')->first()->id;
});

Shape::$polygonId = Cache::rememberForever('shape-polygon', function () {
    return Shape::whereName('Polygon')->first()->id;
});

Shape::$circleId = Cache::rememberForever('shape-circle', function () {
    return Shape::whereName('Circle')->first()->id;
});

Shape::$rectangleId = Cache::rememberForever('shape-rectangle', function () {
    return Shape::whereName('Rectangle')->first()->id;
});
