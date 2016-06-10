<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

/**
 * The visibility of a model.
 */
class Visibility extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The public visibility
     *
     * @var Visibility
     */
    public static $public;

    /**
     * The private visibility
     *
     * @var Visibility
     */
    public static $private;
}

Visibility::$public = Cache::rememberForever('visibility-public', function () {
    return Visibility::whereName('public')->first();
});

Visibility::$private = Cache::rememberForever('visibility-private', function () {
    return Visibility::whereName('private')->first();
});
