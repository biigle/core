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
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function labels()
	{
		return $this->hasMany('Dias\AnnotationLabel')
			->with('label', 'user');
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
		$point->x = intval($x);
		$point->y = intval($y);
		$index = $this->points()->max('index');
		// the new point gets the next higher index
		$point->index = ($index === null) ? 0 : $index + 1;
		
		return $this->points()->save($point);
	}

	/**
	 * Adds an array of points to this annotation.
	 * A point may be an associative array `['x'=>10, 'y'=>10]` or an object
	 * `{x => 10, y => 10}`.
	 * 
	 * @param array $points array of point arrays or objects
	 */
	public function addPoints($points)
	{
		foreach ($points as $point) {
			// depending on decoding, a point may be an object or an array
			if (is_array($point))
			{
				$this->addPoint($point['x'], $point['y']);
			}
			else
			{
				$this->addPoint($point->x, $point->y);
			}
		}
	}

	/**
	 * Replaces the current points with the given ones.
	 * Does nothing if the given array is empty.
	 * 
	 * @param array $points array of point arrays or objects
	 */
	public function refreshPoints($points)
	{
		if (empty($points)) return;
		$this->points()->delete();
		$this->addPoints($points);
	}

	/**
	 * Adds a new label to this annotation.
	 * 
	 * @param int $labelId
	 * @param float $confidence
	 * @param User $user The user attaching tha label
	 * @return AnnotationLabel
	 */
	public function addLabel($labelId, $confidence, $user)
	{
		try {
			$annotationLabel = new AnnotationLabel;
			$annotationLabel->annotation()->associate($this);
			$annotationLabel->label()->associate(Label::find($labelId));
			$annotationLabel->user()->associate($user);
			$annotationLabel->confidence = $confidence;
			$annotationLabel->save();
			return $annotationLabel;
		} catch (QueryException $e) {
			abort(400, 'The user already attached label "'.$labelId.'" to annotation "'.$this->id.'"!');
		}
	}
}
