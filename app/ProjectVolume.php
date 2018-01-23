<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

/**
 * Pivot model for the connection between Projects and Volumes.
 */
class ProjectVolume extends Model
{
    /**
     * As this is a pivot model the table name is not plural.
     * Laravel 5.5 will support pivot models with own IDs but for now we do it like this.
     *
     * @var string
     */
    protected $table = 'project_volume';

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * The project that is associated with the volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * The volume that is associated with the project.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function volume()
    {
        return $this->belongsTo(Volume::class);
    }
}
