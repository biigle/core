<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Dias\Contracts\BelongsToProjectContract;

/**
 * Annotations consist of one or many of these annotation points, marking
 * a point or a region on an image.
 */
class AnnotationPoint extends Model implements BelongsToProjectContract {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The attributes included in the model's JSON form.
	 *
	 * @var array
	 */
	protected $visible = array(
		'x', 'y'
	);

	/**
	 * The annotation, this point belongs to.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function annotation()
	{
		return $this->belongsTo('Dias\Annotation');
	}

	/**
	 * {@inheritdoc}
	 * @return array
	 */
	public function projectIds()
	{
		return $this->annotation->projectIds();
	}
}
