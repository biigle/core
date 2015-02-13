<?php namespace Dias;

use Dias\Contracts\BelongsToProject;

class Image extends Attributable implements BelongsToProject {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function transect()
	{
		return $this->belongsTo('Dias\Transect');
	}

	public function annotations()
	{
		return $this->hasMany('Dias\Annotation');
	}

	/**
	 * {@inheritdoc}
	 * @return array
	 */
	public function projectIds()
	{
		return $this->transect->projectIds();
	}
}
