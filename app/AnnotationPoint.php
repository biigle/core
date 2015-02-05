<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

class AnnotationPoint extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function annotation()
	{
		return $this->belongsTo('Dias\Annotation');
	}
}
