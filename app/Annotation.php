<?php namespace Dias;

use Dias\Contracts\BelongsToProject;

/**
 * An annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class Annotation extends Attributable implements BelongsToProject {

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		// don't display info from the pivot table
		'pivot',
	);

	/**
	 * The image, this annotation belongs to.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function image()
	{
		return $this->belongsTo('Dias\Image');
	}

	/**
	 * The shape of this annotation.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function shape()
	{
		return $this->belongsTo('Dias\Shape');
	}

	/**
	 * The points, this annotation consists of.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function points()
	{
		return $this->hasMany('Dias\AnnotationPoint');
	}

	/**
	 * The labels, this annotation got assigned by the users.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
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
