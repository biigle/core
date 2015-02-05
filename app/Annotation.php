<?php namespace Dias;

class Annotation extends Attributable {

	public function image()
	{
		return $this->belongsTo('Dias\Image');
	}

	public function shape()
	{
		return $this->belongsTo('Dias\Shape');
	}

	public function points()
	{
		return $this->hasMany('Dias\AnnotationPoint');
	}

	public function labels()
	{
		return $this->belongsToMany('Dias\Label')
			->withPivot('confidence', 'user_id');
	}
}
