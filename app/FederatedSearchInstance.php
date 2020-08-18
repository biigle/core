<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

class FederatedSearchInstance extends Model
{
    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'local_token',
        'remote_token',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'index_interval' => 'int',
        'indexed_at' => 'datetime',
    ];

    /**
     * The models that belong to this instance.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function models()
    {
        return $this->hasMany(FederatedSearchModel::class);
    }
}
