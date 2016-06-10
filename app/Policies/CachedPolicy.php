<?php

namespace Dias\Policies;

use Cache;

class CachedPolicy
{
    /**
     * Time to store the cached values
     *
     * (is irrelevant for the array store)
     *
     * @var int
     */
    const TIME = 1;

    /**
     * The cache instance to use for caching policies.
     *
     * @var Cache
     */
    protected $cache;

    /**
     * Create a new CachedPolicy
     */
    public function __construct()
    {
        $this->cache = Cache::store('array');
    }

    public function remember($key, $callback)
    {
        return call_user_func_array([$this->cache, 'remember'], [$key, self::TIME, $callback]);
    }
}
