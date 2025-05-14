<?php

namespace Biigle\Http\Controllers\Views;

use Illuminate\Http\Response;
use View;

class PrivacyController extends Controller
{
    /**
     * Show the the privacy view.
     */
    public function show()
    {
        if (!View::exists('privacy')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        /* @phpstan-ignore argument.type */
        return view('privacy');
    }
}
