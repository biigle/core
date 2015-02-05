<?php namespace Dias;

class Label extends Attributable {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function parent()
	{
		return $this->belongsTo('Dias\Label');
	}
}
