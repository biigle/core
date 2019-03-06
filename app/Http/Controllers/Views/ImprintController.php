<?php

namespace Biigle\Http\Controllers\Views;

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
            abort(404);
        }

        return view('imprint');
    }
}
