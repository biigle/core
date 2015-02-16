<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

/**
 * Some models can have one or many of these flexible attributes.
 * Attributes are imformation on an object that is very seldom assigned
 * (so no extra database column is created for it).
 */
class Attribute extends Model {
	
	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;
}
