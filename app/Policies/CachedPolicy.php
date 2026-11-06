<?php

namespace Biigle\Policies;

use Cache;

/**
 * A policy for caching the return values of the authorization rules during a request.
 */
class CachedPolicy
{
    /**
     * Time to store the cached values.
     *
     * The array store honors this, but it is irrelevant in practice because policies
     * are only checked during short-lived requests. In long-running processes like
     * queue workers, the array store keeps its values across jobs until they expire.
     *
     * @var int
     */
    const TIME = 60;

    /**
     * The cache instance to use for caching policies.
     *
     * @var \Illuminate\Contracts\Cache\Repository
     */
    protected $cache;

    /**
     * Create a new CachedPolicy.
     */
    public function __construct()
    {
        $this->cache = Cache::store('array');
    }

    /**
     * Wrapper for the Cache::remember function of the array cache.
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
