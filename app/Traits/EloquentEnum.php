<?php

namespace Biigle\Traits;

use Illuminate\Support\Collection;

/**
 * Several enums used to be eloquent models and were changed to int-backed enums later.
 * This trait offers some of the eloquent functionality for int-backed enums.
 * @mixin \BackedEnum
 */
trait EloquentEnum
{
    public static function findOrFail(int|string $id): static
    {
        return static::tryFrom((int) $id) ?? abort(404);
    }

    /**
     * Helper to imitate the original ->pluck('name', 'id') behaviour
     */
    public static function pluckById(?self $except = null): Collection
    {
        $collection = collect(self::cases())
            ->mapWithKeys(fn (self $shape) => [$shape->value => $shape->label()]);
        if ($except !== null) {
            $collection->forget($except->value);
        }
        return $collection;
    }
}
