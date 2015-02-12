<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

class Shape extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * Returns the point shape ID.
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
	 * Returns the line shape ID.
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
	 * Returns the polygon shape ID.
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
	 * Returns the circle shape ID.
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
