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
		'name' => 'required|max:512|unique:attributes',
		'type' => 'required|in:integer,double,string,boolean',
	);

	/**
	 * Validation rules for attaching a new attribute to a model
	 * 
	 * @var array
	 */
	public static $attachRules = array(
		'name'  => 'required|max:512|exists:attributes',
		'value' => 'required'
	);
	
	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		// don't display info from the pivot table
		'pivot',
	);
}
