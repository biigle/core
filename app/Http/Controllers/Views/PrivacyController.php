<?php

namespace Biigle\Http\Controllers\Views;

use View;

class PrivacyController extends Controller
{
    /**
     * Show the the privacy view.
     *
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        if (!View::exists('privacy')) {
            abort(404);
        }

        return view('privacy');
    }
}
