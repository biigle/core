<?php namespace Dias;

use Dias\Contracts\BelongsToProject;

class Transect extends Attributable implements BelongsToProject {

	public function creator()
	{
		return $this->belongsTo('Dias\User');
	}

	public function mediaType()
	{
		return $this->belongsTo('Dias\MediaType');
	}

	public function images()
	{
		return $this->hasMany('Dias\Image');
	}

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
		return $this->projects()->lists('id');
	}
}
