<?php namespace Dias;

use Dias\Contracts\BelongsToProject;

class Annotation extends Attributable implements BelongsToProject {

	// don't display info from the pivot table
	protected $hidden = array(
		'pivot',
	);

	public function image()
	{
		return $this->belongsTo('Dias\Image');
	}

	public function shape()
	{
		return $this->belongsTo('Dias\Shape');
	}

	public function points()
	{
		return $this->hasMany('Dias\AnnotationPoint');
	}

	public function labels()
	{
		return $this->belongsToMany('Dias\Label')
			// display confidence and user_id directly in the labels object and
			// not in the pivot table object
			->withPivot('confidence as confidence', 'user_id as user_id');
	}

	/**
	 * {@inheritdoc}
	 * @return array
	 */
	public function projectIds()
	{
		return $this->image->projectIds();
	}
}
