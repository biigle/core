<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

/**
 * A shape, e.g. `point` or `circle`.
 */
class Shape extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The point shape ID.
	 * 
	 * @return int
	 */
	public static function pointId()
	{
		return Cache::rememberForever('shape-point', function()
		{
			return Shape::whereName('point')->first()->id;
		});
	}

	/**
	 * The line shape ID.
	 * 
	 * @return int
	 */
	public static function lineId()
	{
		return Cache::rememberForever('shape-line', function()
		{
			return Shape::whereName('line')->first()->id;
		});
	}

	/**
	 * The polygon shape ID.
	 * 
	 * @return int
	 */
	public static function polygonId()
	{
		return Cache::rememberForever('shape-polygon', function()
		{
			return Shape::whereName('polygon')->first()->id;
		});
	}

	/**
	 * The circle shape ID.
	 * 
	 * @return int
	 */
	public static function circleId()
	{
		return Cache::rememberForever('shape-circle', function()
		{
			return Shape::whereName('circle')->first()->id;
		});
	}
}
