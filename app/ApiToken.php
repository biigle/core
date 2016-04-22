<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;

class ApiToken extends Model
{
    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'hash',
    ];

    /**
     * The user, this token belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function owner()
    {
        return $this->belongsTo('Dias\User');
    }
}
