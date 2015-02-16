<?php namespace Dias;

use Dias\Contracts\BelongsToProject;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends Attributable implements BelongsToProject {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The transect, this image belongs to.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function transect()
	{
		return $this->belongsTo('Dias\Transect');
	}

	/**
	 * The annotations on this image.
	 * 
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
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
