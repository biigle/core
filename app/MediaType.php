<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

/**
 * Transects can contain different types of image-series. One type would
 * be a time-series of a static camera taking photos in regular intervals
 * for example. Another type coud be images from a moving camera.
 */
class MediaType extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The time series media type ID.
	 * 
	 * @return int
	 */
	public static function timeSeriesId()
	{
		return Cache::rememberForever('media-type-time-series', function()
		{
			return MediaType::whereName('time-series')->first()->id;
		});
	}

	/**
	 * The location series media type ID.
	 * 
	 * @return int
	 */
	public static function locationSeriesId()
	{
		return Cache::rememberForever('media-type-location-series', function()
		{
			return MediaType::whereName('location-series')->first()->id;
		});
	}

}
