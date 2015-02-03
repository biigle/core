<?php

class AnnotationPoint extends Eloquent {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function annotation()
	{
		return $this->belongsTo('Annotation');
	}
}
