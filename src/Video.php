<?php

namespace Biigle\Modules\Videos;

use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'uuid',
        'meta',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'meta' => 'array',
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
     * Get the name of the storage disk of this video.
     *
     * @return string
     */
    public function getDisk()
    {
        return explode('://', $this->url)[0];
    }

    /**
     * Get the file path in the storage disk of this video.
     *
     * @return string
     */
    public function getPath()
    {
        return explode('://', $this->url)[1];
    }
}
