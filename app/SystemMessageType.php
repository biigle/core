<?php

namespace Dias;

use Cache;
use Illuminate\Database\Eloquent\Model;

class SystemMessageType extends Model
{
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The important type.
     *
     * @var SystemMessage
     */
    public static $important;

    /**
     * The update type.
     *
     * @var SystemMessage
     */
    public static $update;

    /**
     * The info type.
     *
     * @var SystemMessage
     */
    public static $info;
}

SystemMessageType::$important = Cache::rememberForever('system-message-type-important', function () {
    return SystemMessageType::whereName('important')->first();
});

SystemMessageType::$update = Cache::rememberForever('system-message-type-update', function () {
    return SystemMessageType::whereName('update')->first();
});

SystemMessageType::$info = Cache::rememberForever('system-message-type-info', function () {
    return SystemMessageType::whereName('info')->first();
});
