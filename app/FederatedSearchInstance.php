<?php

namespace Biigle;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;

class FederatedSearchInstance extends Model implements AuthenticatableContract
{
    use Authenticatable;

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
     * Scope a query to all instances that are have a local token.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithLocalToken($query)
    {
        return $query->whereNotNull('local_token');
    }

    /**
     * Scope a query to all instances that are have a remote token.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithRemoteToken($query)
    {
        return $query->whereNotNull('remote_token');
    }

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
