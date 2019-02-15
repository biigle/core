<?php

namespace Biigle\Modules\Videos;

use DB;
use Biigle\User;
use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Model;
use Biigle\FileCache\Contracts\File as FileContract;

class Video extends Model implements FileContract
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
     * Scope a query to all videos that are accessible by a user.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeAccessibleBy($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        return $query->whereExists(function ($query) use ($user) {
            $query->select(DB::raw(1))
                ->from('videos')
                ->join('project_user', 'project_user.project_id', '=', 'videos.project_id')
                ->where('project_user.user_id', $user->id);
        });
    }

    /**
     * {@inheritdoc}
     */
    public function getUrl()
    {
        return $this->url;
    }

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

    /**
     * Determine if this video comes from a remote source.
     *
     * @return bool
     */
    public function isRemote()
    {
        return strpos($this->url, 'http') === 0;
    }
}
