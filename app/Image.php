<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Response;
use ErrorException;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends Model
{
    /**
     * Image file format for the thumbnail images.
     *
     * @var string
     */
    const THUMB_FORMAT = 'jpg';

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
        'DateTime',
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
     * The attributes included in the model's JSON form. All other are hidden.
     *
     * @var array
     */
    protected $visible = [
        'id',
        'transect',
        'annotations',
        'filename',
        'exif',
        'width',
        'height',
    ];

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
     * Adds the `thumbPath` attribute to the image model. The path points
     * to the thumbnail image file of this image.
     *
     * @return string
     */
    public function getThumbPathAttribute()
    {
        return config('thumbnails.storage').'/'.$this->id.'.'.self::THUMB_FORMAT;
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
     * Returns a subset of the EXIF metadata of the image file.
     * The subset is defined in `$exifSubset`.
     *
     * @return array
     */
    public function getExif()
    {
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
     * Returns the image size as `[width, height]`
     *
     * @return array
     */
    public function getSize()
    {
        return getimagesize($this->url);
    }

    /**
     * Get the thumbnail image as download response
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
     * Get the original image as download response
     *
     * @return Response
     */
    public function getFile()
    {
        try {
            // TODO download() doesn't work for external resources
            // InterventionImage::make() does but is very memory expensive
            return Response::download($this->url);
        } catch (FileNotFoundException $e) {
            // source file not readable; nothing we can do about it
            abort(404, $e->getMessage());
        }
    }
}
