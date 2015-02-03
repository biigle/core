<?php

class Transect extends Eloquent {

	public function creator()
	{
		return $this->belongsTo('User');
	}

	public function mediaType()
	{
		return $this->belongsTo('MediaType');
	}
}
