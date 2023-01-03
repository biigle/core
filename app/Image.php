<?php

namespace Biigle;

use Exception;
use FileCache;
use Illuminate\Http\Response;

/**
 * This model stores information on an image file in the file system.
 */
class Image extends VolumeFile
{
    /**
     * Allowed image MIME types.
     *
     * @var array
     */
    const MIMES = [
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/webp',
    ];

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
     * The annotations on this image.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotations()
    {
        return $this->hasMany(ImageAnnotation::class);
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
     * Get the original image as download response.
     *
     * @return Response
     */
    public function getFile()
    {
        if ($this->tiled === true) {
            $response = [
                'id' => $this->id,
                'uuid' => $this->uuid,
                'width' => $this->width,
                'height' => $this->height,
                'tiled' => true,
                'tilingInProgress' => $this->tilingInProgress,
            ];

            return $response;
        }

        if ($this->volume->isRemote()) {
            return redirect($this->url);
        }

        try {
            $stream = FileCache::getStream($this);
            if (!is_resource($stream)) {
                abort(Response::HTTP_NOT_FOUND);
            }

            return response()->stream(function () use ($stream) {
                fpassthru($stream);
            }, 200, [
                'Content-Type' => $this->mimetype,
                'Content-Length' => $this->size,
                'Content-Disposition' => 'inline',
            ]);
        } catch (Exception $e) {
            abort(404, $e->getMessage());
        }
    }

    /**
     * Set the tilingInProgress attribute.
     *
     * @param bool $value
     */
    public function setTilingInProgressAttribute($value)
    {
        $this->setJsonAttr('tilingInProgress', $value === true ? $value : null);
    }

    /**
     * Get the tilingInProgress attribute.
     *
     * @return bool|null
     */
    public function getTilingInProgressAttribute()
    {
        return $this->getJsonAttr('tilingInProgress', false);
    }

    /**
     * URL to the thumbnail of this image.
     *
     * @return string
     */
    public function getThumbnailUrlAttribute()
    {
        return thumbnail_url($this->uuid);
    }
}
