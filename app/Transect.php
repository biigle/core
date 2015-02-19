<?php namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Model\ModelWithAttributes;

use Cache;

/**
 * A transect is a collection of images. Transects belong to one or many
 * projects.
 */
class Transect extends ModelWithAttributes implements BelongsToProjectContract {

	/**
	 * The user that created the transect.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function creator()
	{
		return $this->belongsTo('Dias\User');
	}

	/**
	 * The media type of this transect.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function mediaType()
	{
		return $this->belongsTo('Dias\MediaType');
	}

	/**
	 * The images belonging to this transect.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function images()
	{
		return $this->hasMany('Dias\Image');
	}

	/**
	 * The project(s), this transect belongs to.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function projects()
	{
		return $this->belongsToMany('Dias\Project');
	}

	/**
	 * {@inheritdoc}
	 * @return array
	 */
	public function projectIds()
	{
		/*
		 * remember project IDs because e.g. this query would be performed for 
		 * each and every image request, which would result in dozens of 
		 * calls per *single* page.
		 */
		return Cache::remember('transect-'.$this->id.'pids', 0.5, function() {
			return $this->projects()->lists('id');
		});
	}
}
