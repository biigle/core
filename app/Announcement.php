<?php

namespace Biigle;

use Cache;
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
     * Key to use to cache the active announcement.
     */
    const CACHE_KEY = 'announcement';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['title', 'show_until', 'body'];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'show_until' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleted(function ($announcement) {
            Cache::forget(self::CACHE_KEY);
        });
    }

    /**
     * Get the currently active announcement.
     *
     * @return Announcement
     */
    public static function getActive()
    {
        // Store false if no announcement exists because null can't be stored.
        return Cache::rememberForever(self::CACHE_KEY, fn () => self::active()->first() ?: false) ?: null;
    }

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
