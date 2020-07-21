<?php

namespace Biigle;

use Biigle\Events\VideoDeleted;
use Biigle\User;
use DB;

class Video extends VolumeFile
{
    /**
     * Allowed video MIME types.
     *
     * @var array
     */
    const MIMES = [
        'video/mpeg',
        'video/mp4',
        'video/quicktime',
        'video/webm',
    ];

    /**
     * Allowed video codecs.
     *
     * @var array
     */
    const CODECS = [
        'h264',
        'vp8',
        'vp9',
        'av1',
    ];

    /**
     * Error if a video cannot be found.
     *
     * @var int
     */
    const ERROR_NOT_FOUND = 1;

    /**
     * Error if a video has an invalid MIME type.
     *
     * @var int
     */
    const ERROR_MIME_TYPE = 2;

    /**
     * Error if a video has an invalid codec.
     *
     * @var int
     */
    const ERROR_CODEC = 3;

    /**
     * Error if a video cannot be parsed.
     *
     * @var int
     */
    const ERROR_MALFORMED = 4;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'filename',
        'volume_id',
        'uuid',
        'attrs',
        'duration',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'attrs' => 'array',
        'duration' => 'float',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'attrs',
    ];

    /**
     * The event map for the model.
     *
     * @var array
     */
    protected $dispatchesEvents = [
        'deleted' => VideoDeleted::class,
    ];

    /**
     * The annotations that belong to this video.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function annotations()
    {
        return $this->hasMany(VideoAnnotation::class);
    }

    /**
     * Thumbnail string of this video. Use with the `thumbnail_url` helper function.
     *
     * @return string
     */
    public function getThumbnailAttribute()
    {
        $thumbnails = $this->thumbnails;

        return $thumbnails[intdiv(count($thumbnails), 2)];
    }

    /**
     * URL to the thumbnail of this video.
     *
     * @return string
     */
    public function getThumbnailUrlAttribute()
    {
        return thumbnail_url($this->thumbnail, config('videos.thumbnail_storage_disk'));
    }

    /**
     * Thumbnails array of this video. Use with the `thumbnail_url` helper function.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailsAttribute()
    {
        return collect(range(0, config('videos.thumbnail_count') - 1))
            ->map(function ($i) {
                return "{$this->uuid}/{$i}";
            });
    }

    /**
     * URLs to the thumbnails of this video.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailsUrlAttribute()
    {
        return $this->thumbnails->map(function ($item) {
            return thumbnail_url($item, config('videos.thumbnail_storage_disk'));
        });
    }

    /**
     * Get the error attribute.
     *
     * @return string
     */
    public function getErrorAttribute()
    {
        return $this->getJsonAttr('error');
    }

    /**
     * Set the error attribute.
     *
     * @param string $value
     */
    public function setErrorAttribute($value)
    {
        $this->setJsonAttr('error', $value);
    }

    /**
     * Get the mimeType attribute.
     *
     * @return string
     */
    public function getMimeTypeAttribute()
    {
        return $this->getJsonAttr('mimetype');
    }

    /**
     * Set the mimeType attribute.
     *
     * @param string $value
     */
    public function setMimeTypeAttribute($value)
    {
        $this->setJsonAttr('mimetype', $value);
    }

    /**
     * Get the size attribute.
     *
     * @return int
     */
    public function getSizeAttribute()
    {
        return $this->getJsonAttr('size');
    }

    /**
     * Set the size attribute.
     *
     * @param int $value
     */
    public function setSizeAttribute($value)
    {
        $this->setJsonAttr('size', $value);
    }
}
