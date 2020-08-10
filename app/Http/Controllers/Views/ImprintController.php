<?php

namespace Biigle\Http\Controllers\Views;

use Illuminate\Http\Response;
use View;

class ImprintController extends Controller
{
    /**
     * Show the the imprint view.
     *
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        if (!View::exists('imprint')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return view('imprint');
    }
}
