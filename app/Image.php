<?php

namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Dias\Model\ModelWithAttributes;
use InterventionImage;
use Response;
use File;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends ModelWithAttributes implements BelongsToProjectContract
{
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
     * Create a new thumbnail image file.
     *
     * @return InterventionImage
     */
    private function createThumbnail()
    {
        ini_set('memory_limit', '512M');
        return InterventionImage::make($this->url)
            ->resize(180, 135, function ($constraint) {
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
        // if the image was marked for deletion it doesn't belong to a project
        // any more. like this nobody is able to see the image, too.
        if ($this->transect === null) {
            return [];
        }

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
     * Returns a subset of the EXIF metadata of the image file.
     * The subset is defined in `$exifSubset`.
     *
     * @return array
     */
    public function getExif()
    {
        $exif = exif_read_data($this->url);

        // get only part of the exif data because other fields may contain
        // corrupted utf8 encoding, which will break json_encode()!
        // also it limits the size of the JSON output
        return array_only($exif, self::$exifSubset);
    }

    /**
     * Get the thumbnail image object. The thumbnail will be created if it
     * doesn't exist.
     *
     * @return InterventionImage
     */
    public function getThumb()
    {
        if (!File::exists($this->thumbPath)) {
            $this->createThumbnail();
        }

        return Response::download($this->thumbPath);
    }

    /**
     * Get the original image file object. The image my be fetched from an
     * external source.
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
