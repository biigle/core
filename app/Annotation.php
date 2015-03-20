<?php namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Model\ModelWithAttributes;

use Illuminate\Database\QueryException;

/**
 * An annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class Annotation extends ModelWithAttributes implements BelongsToProjectContract {

	/**
	 * Validation rules for attaching a label to a annotation
	 * 
	 * @var array
	 */
	public static $attachLabelRules = array(
		'label_id'    => 'required|exists:labels,id',
		'confidence'  => 'required|numeric|between:0,1'
	);

	/**
	 * Validation rules for creating a point for an annotation
	 * 
	 * @var array
	 */
	public static $createPointRules = array(
		'x'    => 'required|numeric',
		'y'    => 'required|numeric',
	);

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
			// display these attributes directly in the labels object and
			// not in the pivot table object
			->withPivot(
				'confidence as confidence',
				'user_id as user_id',
				'annotation_id as annotation_id'
			);
	}

	/**
	 * {@inheritdoc}
	 * @return array
	 */
	public function projectIds()
	{
		return $this->image->projectIds();
	}

	/**
	 * Adds a new point to this annotation.
	 * 
	 * @param int $x x position of the point
	 * @param int $y y position of the point
	 * @return AnnotationPoint
	 */
	public function addPoint($x, $y)
	{
		$point = new AnnotationPoint;
		$point->x = $x;
		$point->y = $y;
		$index = $this->points()->max('index');
		// the new point gets the next higher index
		$point->index = ($index === null) ? 0 : $index + 1;
		
		return $this->points()->save($point);
	}

	/**
	 * Adds a new label to this annotation.
	 * 
	 * @param int $labelId
	 * @param float $confidence
	 * @param User $user The user attaching tha label
	 * @return void
	 */
	public function addLabel($labelId, $confidence, $user)
	{
		try {
			$this->labels()->attach($labelId, array(
				'user_id' => $user->id,
				'confidence' => $confidence
			));
		} catch (QueryException $e) {
			abort(400, 'The user already attached label "'.$labelId.'" to annotation "'.$this->id.'"!');
		}
	}

	/**
	 * Detaches the specified label attached by the specified user from this
	 * annotation.
	 * 
	 * @param int $labelId
	 * @param int $userId
	 * @return boolean `false` if nothing was detached (the label didn't exist)
	 */
	public function removeLabel($labelId, $userId)
	{
		// TODO do this using Eloquent somehow?
		return (boolean) \DB::delete('DELETE FROM annotation_label WHERE annotation_id = ? AND label_id = ? AND user_id = ?', array($this->id, $labelId, $userId));
	}
}
