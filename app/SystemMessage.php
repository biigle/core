<?php

namespace Dias;

use Notification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Dias\Notifications\NewSystemMessageNotification;

/**
 * System messages are broadcasts from the application administrators that reach
 * all users of the instance. Whenevr a new system message is published, each
 * user will get a notification to read it.
 */
class SystemMessage extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['title', 'type_id', 'body'];

    /**
     * Validation rules creating a new system message.
     *
     * @var array
     */
    public static $createRules = [
        'title' => 'required',
        'body' => 'required',
        'type_id' => 'exists:system_message_types,id',
        'publish' => 'boolean',
    ];

    /**
     * Validation rules for updating a system message.
     *
     * @var array
     */
    public static $updateRules = [
        'type_id' => 'exists:system_message_types,id',
        'publish' => 'boolean',
    ];

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
     * @return boolean
     */
    public function isPublished()
    {
        return $this->published_at !== null;
    }
}
