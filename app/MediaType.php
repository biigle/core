<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

class MediaType extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * Returns the time series media type ID.
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
	 * Returns the location series media type ID.
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
