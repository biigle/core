<?php namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Model\ModelWithAttributes;

use InterventionImage;
use Intervention\Image\Exception\NotReadableException;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends ModelWithAttributes implements BelongsToProjectContract {

	/**
	 * The absolute path to the image thumbnail storage directory.
	 * 
	 * @var string
	 */
	public static $thumbPath;

	/**
	 * The model boot method.
	 */
	public static function boot()
	{
		parent::boot();
		self::$thumbPath = storage_path().'/thumbs';
	}

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;


	/**
	 * The attributes included in the model's JSON form. All other are hidden.
	 *
	 * @var array
	 */
	protected $visible = array(
		'id',
		'transect_id',
	);

	/**
	 * Create a new thumbnail image file.
	 * 
	 * @return InterventionImage
	 */
	private function createThumbnail()
	{
		return $this->getFile()
			->resize(180, 180, function ($constraint)
			{
				// resize images proportionally
				$constraint->aspectRatio();
			})
			->encode('jpg')
			->save($this->thumbPath);
	}

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
	 * 
	 * @return array
	 */
	public function projectIds()
	{
		return $this->transect->projectIds();
	}

	/**
	 * Adds the `thumbPath` attribute to the image model. The path points
	 * to the thumbnail image file of this image.
	 * 
	 * @return string
	 */
	public function getThumbPathAttribute()
	{
		return self::$thumbPath.'/'.$this->id.'.jpg';
	}

	/**
	 * Adds the `url` attribute to the image model. The url is the absolute path
	 * to the original image file.
	 * 
	 * @return string
	 */
	public function getUrlAttribute()
	{
		return $this->transect->url.'/'.$this->filename;
	}

	/**
	 * Get the thumbnail image object. The thumbnail will be created if it
	 * doesn't exist.
	 * 
	 * @return InterventionImage
	 */
	public function getThumb()
	{
		try {
			$thumb = InterventionImage::make($this->thumbPath);
		} catch (NotReadableException $e) {
			// file doesn't exist
			$thumb = $this->createThumbnail();
		}

		return $thumb;
	}

	/**
	 * Get the original image file object. The image my be fetched from an
	 * external resource.
	 * 
	 * @return InterventionImage
	 */
	public function getFile()
	{
		return InterventionImage::make($this->url);
	}
}
