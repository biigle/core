<?php namespace Dias;

class Transect extends Attributable {

	public function creator()
	{
		return $this->belongsTo('Dias\User');
	}

	public function mediaType()
	{
		return $this->belongsTo('Dias\MediaType');
	}
}
