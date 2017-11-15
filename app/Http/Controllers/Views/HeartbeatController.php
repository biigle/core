<?php

namespace Biigle\Http\Controllers\Views;

class HeartbeatController extends Controller
{
    /**
     * Do nothing but to keep the CSRF token valid.
     *
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        return response('', 204);
    }
}
