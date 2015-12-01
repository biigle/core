<?php

namespace Dias\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * @var array
     */
    protected $middleware = [
        'Illuminate\Foundation\Http\Middleware\CheckForMaintenanceMode',
        'Illuminate\Cookie\Middleware\EncryptCookies',
        'Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse',
        'Illuminate\Session\Middleware\StartSession',
        'Illuminate\View\Middleware\ShareErrorsFromSession',
        'Dias\Http\Middleware\VerifyCsrfToken',
        'Dias\Http\Middleware\UpdateUserActivity',
    ];

    /**
     * The application's route middleware.
     *
     * @var array
     */
    protected $routeMiddleware = [
        'auth' => 'Dias\Http\Middleware\Authenticate',
        'auth.api' => 'Dias\Http\Middleware\AuthenticateAPI',
        'auth.basic' => 'Illuminate\Auth\Middleware\AuthenticateWithBasicAuth',
        'guest' => 'Dias\Http\Middleware\RedirectIfAuthenticated',
        'admin' => 'Dias\Http\Middleware\RequireAdmin',
        'session' => 'Dias\Http\Middleware\SessionOnly',
    ];
}
