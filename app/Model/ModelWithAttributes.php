<?php namespace Dias\Model;

use Illuminate\Database\Eloquent\Model;

/**
 * A model that can belong to an attribute.
 */
abstract class ModelWithAttributes extends Model {

	/**
	 * The attributes of this model.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function attributes()
	{
		return $this->belongsToMany('Dias\Attribute')
			->withPivot('value_int', 'value_double', 'value_string');
	}
}
