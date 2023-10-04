<?php

namespace Biigle\Traits;

use Cache;
use Str;

/**
 * Some models have fixed, "constant" instances. An example is the Role model, which may
 * have e.g. the roles "admin" and "user". These are always the same and do not change.
 * This trait makes it possible to call these constant instances of the model as static
 * methods. With the Role model you would be able to call Role::admin() or Role::user()
 * to get the model instances or Role::adminId() or Role::userId() to get the IDs of the
 * model instances.
 *
 * Constant instances are defined in the INSTANCES constant array of the model. It maps
 * keys ("admin", "user") to the "name" attributes of the models in the database which
 * may or may not be the same than the keys. Example:
 *
 * const INSTANCES = [
 *     'admin' => 'Admin',
 *     'user' => 'User',
 * ];
 */
trait HasConstantInstances
{
    /**
     * Get one of the instances of this model that are defined in the INSTANCES constant
     * array.
     *
     * @param string $key Can be he instance name like "myName" or to get the instance ID
     * "myNameId".
     * @param mixed $arguments
     */
    public static function __callStatic($key, $arguments): mixed
    {
        if (is_array(static::INSTANCES)) {
            $wantsId = Str::endsWith($key, 'Id');
            if ($wantsId) {
                $key = substr($key, 0, -2);
            }

            if (array_key_exists($key, static::INSTANCES)) {
                $name = static::INSTANCES[$key];
                $cacheKey = static::class.'::'.$key;

                $instance = Cache::rememberForever($cacheKey, function () use ($name) {
                    return static::whereName($name)->first();
                });

                return $wantsId ? $instance->id : $instance;
            }
        }

        return parent::__callStatic($key, $arguments);
    }
}
