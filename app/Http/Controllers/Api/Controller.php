<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Controllers\Controller as BaseController;
use Route;

abstract class Controller extends BaseController
{
    /**
     * Redirects to the _redirect URL, to a route or else back.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    protected function fuzzyRedirect()
    {
        if (request()->filled('_redirect')) {
            return redirect(request()->input('_redirect'));
        }

        $args = func_get_args();

        if (isset($args[0]) && Route::has($args[0])) {
            return call_user_func_array([redirect(), 'route'], $args);
        }

        return redirect()->back();
    }
}
