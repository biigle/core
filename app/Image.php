<?php

namespace Biigle;

use Response;
use ErrorException;
use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Model;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends Model
{
    use HasJsonAttributes;

    /**
     * Validation rules for attaching a label to an image.
     *
     * @var array
     */
    public static $attachLabelRules = [
        'label_id'    => 'required|exists:labels,id',
    ];

    /**
     * Validation rules for creating a new annotation in an image.
     *
     * @var array
     */
    public static $createAnnotationRules = [
        'shape_id' => 'required|exists:shapes,id',
        'points'   => 'required',
    ];

    /**
     * Contains the array keys that should be included in the EXIF data
     * if the image. All other fields in the original EXIF array will be
     * ignored.
     *
     * @var array
     */
    private static $exifSubset = [
        'FileName',
        'FileDateTime',
        'FileSize',
        'FileType',
        'MimeType',
        'Make',
        'Model',
        'Orientation',
        'ExposureTime',
        'FNumber',
        'ShutterSpeedValue',
        'ApertureValue',
        'ExposureBiasValue',
        'MaxApertureValue',
        'MeteringMode',
        'Flash',
        'FocalLength',
        'ExifImageWidth',
        'ExifImageLength',
        'ImageType',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes hidden in the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'labels',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'attrs' => 'array',
        'lat' => 'float',
        'lng' => 'float',
        'tiled' => 'bool',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'taken_at',
    ];

    /**
     * The volume, this image belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function volume()
    {
        return $this->belongsTo(Volume::class);
    }

    /**
     * The annotations on this image.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotations()
    {
        return $this->hasMany(Annotation::class);
    }

    /**
     * The labels, this image got attached by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany(ImageLabel::class)->with('label', 'user');
    }

    /**
     * Adds the `thumbPath` attribute to the image model. The path points
     * to the thumbnail image file of this image.
     *
     * @return string
     */
    public function getThumbPathAttribute()
    {
        return public_path(config('thumbnails.uri').'/'.$this->uuid.'.'.config('thumbnails.format'));
    }

    /**
     * Adds the `tilePath` attribute to the image model. The path points
     * to the directory storing the image tiles.
     *
     * @return string
     */
    public function getTilePathAttribute()
    {
        return public_path(config('image.tiles.uri').'/'.$this->uuid);
    }

    /**
     * Adds the `url` attribute to the image model. The url is the absolute path
     * to the original image file.
     *
     * @return string
     */
    public function getUrlAttribute()
    {
        return $this->volume->url.'/'.$this->filename;
    }

    /**
     * Returns a subset of the EXIF metadata of the image file.
     * The subset is defined in `$exifSubset`.
     *
     * Only works for local images.
     *
     * @return array
     */
    public function getExif()
    {
        if ($this->volume->isRemote()) {
            return [];
        }

        try {
            $exif = exif_read_data($this->url);
        } catch (ErrorException $e) {
            // exif not supported for the file
            return [];
        }

        // get only part of the exif data because other fields may contain
        // corrupted utf8 encoding, which will break json_encode()!
        // also it limits the size of the JSON output
        return array_only($exif, self::$exifSubset);
    }

    /**
     * Returns the image size as `[width, height]`.
     *
     * @return array
     */
    public function getSize()
    {
        return getimagesize($this->url);
    }

    /**
     * Get the thumbnail image as download response.
     *
     * @return Response
     */
    public function getThumb()
    {
        try {
            return Response::download($this->thumbPath);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }

    /**
     * Get the original image as download response.
     *
     * @return Response
     */
    public function getFile()
    {
        if ($this->volume->isRemote()) {
            return Response::redirectTo($this->url);
        }

        try {
            return Response::download($this->url);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }

    /**
     * Set properties of a tiled image as dynamic JSON attributes.
     *
     * @param array $properties
     */
    public function setTileProperties(array $properties)
    {
        $properties = array_only($properties, ['width', 'height']);
        if (!empty($properties)) {
            $this->setJsonAttr('tileProperties', $properties);
        }
    }

    /**
     * Get properties of a tiled image from dynamic JSON attributes.
     *
     * @return [type]
     */
    public function getTileProperties()
    {
        return $this->getJsonAttr('tileProperties');
    }
}
