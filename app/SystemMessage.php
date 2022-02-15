<?php

namespace Biigle;

use Biigle\Notifications\NewSystemMessageNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Notification;

/**
 * System messages are broadcasts from the application administrators that reach
 * all users of the instance. Whenevr a new system message is published, each
 * user will get a notification to read it.
 */
class SystemMessage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['title', 'type_id', 'body'];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * All published system messages.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('system_messages.published_at');
    }

    /**
     * The type of this system message.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function type()
    {
        return $this->belongsTo(SystemMessageType::class);
    }

    /**
     * Publishes this system message if it wasn't alerady published.
     */
    public function publish()
    {
        if ($this->isPublished()) {
            return;
        }

        $this->published_at = Carbon::now();
        $this->save();
        $users = User::select('id')->get();
        Notification::send($users, new NewSystemMessageNotification($this));
    }

    /**
     * Returns whether this system message is published.
     *
     * @return bool
     */
    public function isPublished()
    {
        return $this->published_at !== null;
    }
}
