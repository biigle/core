<?php

namespace Biigle\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\TrimStrings as Middleware;

class TrimStrings extends Middleware
{
    /**
     * The names of the attributes that should not be trimmed.
     *
     * @var list<string>
     */
    protected $except = [
        'current_password',
        'password',
        'password_confirmation',
    ];
}
