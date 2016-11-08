<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;

/**
 * System messages are broadcasts from the application administrators that reach
 * all users of the instance. Whenevr a new system message is published, each
 * user will get a notification to read it.
 */
class SystemMessage extends Model
{
    /**
     * The type of this system message.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function type()
    {
        return $this->belongsTo(SystemMessageType::class);
    }
}
