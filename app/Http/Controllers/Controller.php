<?php

namespace Biigle\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Determines if the request was done by an automated script (with API
     * token or ajax).
     *
     * @param Request $request
     * @return bool
     */
    public function isAutomatedRequest(Request $request = null)
    {
        $request = $request ?: request();

        return $request->ajax() || $request->wantsJson() || $request->getUser();
    }
}
