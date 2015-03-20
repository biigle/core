<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

/**
 * Some models can have one or many of these flexible attributes.
 * Attributes are imformation on an object that is very seldom assigned
 * (so no extra database column is created for it).
 */
class Attribute extends Model {

	/**
	 * Validation rules for creating a new attribute
	 * 
	 * @var array
	 */
	public static $createRules = array(
		'name' => 'required|max:512',
		'type' => 'required|in:integer,double,string,boolean',
	);
	
	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;
}
