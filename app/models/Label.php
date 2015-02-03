<?php

class Label extends Eloquent {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function parent()
	{
		return $this->belongsTo('Label');
	}
}
