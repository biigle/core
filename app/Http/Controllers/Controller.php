<?php

namespace Biigle\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * Determines if the request was done by an automated script (with API
     * token or ajax).
     *
     * @param Request $request
     * @return bool
     */
    public static function isAutomatedRequest(Request $request)
    {
        return $request->ajax() || $request->wantsJson() || $request->getUser();
    }
}
