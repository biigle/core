<?php

class Transect extends Attributable {

	public function creator()
	{
		return $this->belongsTo('User');
	}

	public function mediaType()
	{
		return $this->belongsTo('MediaType');
	}
}
