<?php

namespace Biigle;

use Carbon\Carbon;

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
        // The 3GP container format can also store h.264 videos. Other codecs will be
        // rejected.
        'video/3gpp',
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
     * Error if a video file is too large.
     *
     * @var int
     */
    const ERROR_TOO_LARGE = 5;

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
        'lng',
        'lat',
        'taken_at',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'attrs' => 'array',
        'lng' => 'array',
        'lat' => 'array',
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
            ->map(fn ($i) => "{$this->uuid}/{$i}");
    }

    /**
     * URLs to the thumbnails of this video.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getThumbnailsUrlAttribute()
    {
        return $this->thumbnails->map(fn ($item) => thumbnail_url($item, config('videos.thumbnail_storage_disk')));
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
     * Determine whether the (new) video has been processed.
     *
     * @return boolean
     */
    public function hasBeenProcessed()
    {
        return !is_null($this->size);
    }

    /**
     * The labels, this video got attached by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany(VideoLabel::class)->with('label', 'user');
    }

    /**
     * Set the taken_at timestamps.
     *
     * @param array $value
     */
    public function setTakenAtAttribute(?array $value)
    {
        if (is_array($value)) {
            $value = array_map([Carbon::class, 'parse'], $value);

            $this->attributes['taken_at'] = json_encode($value);
        } else {
            $this->attributes['taken_at'] = $value;
        }
    }

    /**
     * Get the taken_at timestamps.
     *
     * @return array
     */
    public function getTakenAtAttribute()
    {
        $array = json_decode($this->attributes['taken_at'] ?? null);

        if (!is_array($array)) {
            return null;
        }

        return array_map([Carbon::class, 'parse'], $array);
    }
}
