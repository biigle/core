<?php

namespace Dias\Policies;

use Cache;

/**
 * A policy for caching the return values of the authorization rules during a request
 */
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

    /**
     * Wrapper for the Cache::remember function of the array cache
     *
     * @param string $key Key of the cached item
     * @param callable $callback Callback returning the cached item
     * @return mixed
     */
    public function remember($key, $callback)
    {
        return call_user_func_array(
            [$this->cache, 'remember'],
            [$key, self::TIME, $callback]
        );
    }
}
