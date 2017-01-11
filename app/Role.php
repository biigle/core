<?php

namespace Biigle;

use Cache;
use Illuminate\Database\Eloquent\Model;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
 */
class Role extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The admin role.
     *
     * @var Role
     */
    public static $admin;

    /**
     * The editor role.
     *
     * @var Role
     */
    public static $editor;

    /**
     * The guest role.
     *
     * @var Role
     */
    public static $guest;
}

Role::$admin = Cache::rememberForever('role-admin', function () {
    return Role::whereName('admin')->first();
});

Role::$editor = Cache::rememberForever('role-editor', function () {
    return Role::whereName('editor')->first();
});

Role::$guest = Cache::rememberForever('role-guest', function () {
    return Role::whereName('guest')->first();
});
