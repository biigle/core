<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Announcements are broadcasts from the application administrators that should reach
 * all users of the instance.
 */
class Announcement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['title', 'show_until', 'body'];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'show_until' => 'datetime',
    ];

    /**
     * Scope a query to the active announcement.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where(function ($query) {
            $query->whereNull('show_until')
                ->orWhere('show_until', '>', now());
        });
    }
}
