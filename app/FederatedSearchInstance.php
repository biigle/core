<?php

namespace Biigle;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FederatedSearchInstance extends Model implements AuthenticatableContract
{
    use Authenticatable, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'url',
        'indexed_at',
        'local_token',
        'remote_token',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'local_token',
        'remote_token',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
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
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<FederatedSearchModel>
     */
    public function models()
    {
        return $this->hasMany(FederatedSearchModel::class);
    }

    /**
     * Set the remote_token attribute.
     *
     * @param string|null $value
     */
    public function setRemoteTokenAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['remote_token'] = null;
        } else {
            $this->attributes['remote_token'] = encrypt($value);
        }
    }

    /**
     * Get the remote_token attribute.
     *
     * @return string|null
     */
    public function getRemoteTokenAttribute()
    {
        if (!isset($this->attributes['remote_token'])) {
            return null;
        } else {
            return decrypt($this->attributes['remote_token']);
        }
    }

    /**
     * Create a new local token and store the sha256 hash in the attribute of this model.
     *
     * @return string New (unhashed) token
     */
    public function createLocalToken()
    {
        $token = Str::random(64);
        // We use sha256 because it is used in the \Illuminate\Auth\TokenGuard of
        // Laravel.
        $this->local_token = hash('sha256', $token);

        return $token;
    }
}
