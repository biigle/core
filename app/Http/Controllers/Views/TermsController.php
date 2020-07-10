<?php

namespace Biigle\Http\Controllers\Views;

use View;

class TermsController extends Controller
{
    /**
     * Show the the terms view.
     *
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        if (!View::exists('terms')) {
            abort(404);
        }

        return view('terms');
    }
}
