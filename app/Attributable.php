<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

class Attributable extends Model {

	public function attributes()
	{
		return $this->belongsToMany('Dias\Attribute')
			->withPivot('value_int', 'value_double', 'value_string');
	}
}
