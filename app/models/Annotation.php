<?php

class Annotation extends Eloquent {

	public function image()
	{
		return $this->belongsTo('Image');
	}

	public function shape()
	{
		return $this->belongsTo('Shape');
	}

	public function points()
	{
		return $this->hasMany('AnnotationPoint');
	}

	public function labels()
	{
		return $this->belongsToMany('Label')
			->withPivot('confidence', 'user_id');
	}
}
