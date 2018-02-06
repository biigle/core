<?php

namespace Biigle;

use Response;
use Exception;
use ImageCache;
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
        $uri = config('thumbnails.uri');
        $format = config('thumbnails.format');

        return public_path("{$uri}/{$this->uuid[0]}{$this->uuid[1]}/{$this->uuid[2]}{$this->uuid[3]}/{$this->uuid}.{$format}");
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
        return "{$this->volume->url}/{$this->filename}";
    }

    /**
     * Set the image metadata attribute.
     *
     * @param array $value
     */
    public function setMetadataAttribute(array $value)
    {
        return $this->setJsonAttr('metadata', $value);
    }

    /**
     * Get the image metadata attribute.
     *
     * @return array
     */
    public function getMetadataAttribute()
    {
        return $this->getJsonAttr('metadata', []);
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

        if ($this->tiled === true) {
            $response = $this->getTileProperties();
            $response['id'] = $this->id;
            $response['uuid'] = $this->uuid;
            $response['tiled'] = true;

            return $response;
        }



        try {
            $streamInfo = ImageCache::getStream($this);

            return response()->stream(function () use ($streamInfo) {
                fpassthru($streamInfo['stream']);
            }, 200, [
                'Content-Type' => $streamInfo['mime'],
                'Content-Length' => $streamInfo['size'],
                'Content-Disposition' => 'inline',
            ]);

        } catch (Exception $e) {
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
