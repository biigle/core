<?php

class Attributable extends Eloquent {

	public function attributes()
	{
		return $this->belongsToMany('Attribute')
			->withPivot('value_int', 'value_double', 'value_string');
	}
}
