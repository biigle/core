<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectInvitation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'uuid',
        'expires_at',
        'max_uses',
        'project_id',
        'role_id',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'expires_at' => 'date',
    ];

    /**
     * The project to which this invitation belongs.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Check if the invitation is still open.
     *
     * @return boolean
     */
    public function isOpen()
    {
        return $this->expires_at > now() && (is_null($this->max_uses) || $this->current_uses < $this->max_uses);
    }
}
