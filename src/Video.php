<?php

namespace Biigle\Modules\Videos;

use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    use HasJsonAttributes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'url',
        'description',
        'project_id',
        'uuid',
        'attrs',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'attrs' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'gis_link',
        'doi',
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
     * The project this video belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

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
     * Get the name of the storage disk of this video.
     *
     * @return string
     */
    public function getDiskAttribute()
    {
        return explode('://', $this->url)[0];
    }

    /**
     * Get the file path in the storage disk of this video.
     *
     * @return string
     */
    public function getPathAttribute()
    {
        return explode('://', $this->url)[1];
    }

    /**
     * Set the gis_link attribute of this volume.
     *
     * @param string $value
     */
    public function setGisLinkAttribute($value)
    {
        return $this->setJsonAttr('gis_link', $value);
    }

    /**
     * Get the gis_link attribute of this volume.
     *
     * @return string
     */
    public function getGisLinkAttribute()
    {
        return $this->getJsonAttr('gis_link');
    }

    /**
     * Set the doi attribute of this volume.
     *
     * @param string $value
     */
    public function setDoiAttribute($value)
    {
        if (is_string($value)) {
            $value = preg_replace('/^https?\:\/\/doi\.org\//', '', $value);
        }

        return $this->setJsonAttr('doi', $value);
    }

    /**
     * Get the doi attribute of this volume.
     *
     * @return string
     */
    public function getDoiAttribute()
    {
        return $this->getJsonAttr('doi');
    }
}
