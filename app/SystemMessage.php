<?php

namespace Dias;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

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
     * Validation rules for registering a new user.
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
     * The type of this system message.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function type()
    {
        return $this->belongsTo(SystemMessageType::class);
    }

    /**
     * Publishes this system message.
     */
    public function publish()
    {
        $this->published_at = Carbon::now();
        $this->save();
    }
}
