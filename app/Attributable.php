<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

/**
 * A model that can belong to an attribute.
 */
abstract class Attributable extends Model {

	public function attributes()
	{
		return $this->belongsToMany('Dias\Attribute')
			->withPivot('value_int', 'value_double', 'value_string');
	}
}
