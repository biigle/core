<?php

namespace Biigle\Http\Controllers\Views;

use Illuminate\Http\Response;
use View;

class TermsController extends Controller
{
    /**
     * Show the the terms view.
     */
    public function show()
    {
        if (!View::exists('terms')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        /* @phpstan-ignore argument.type */
        return view('terms');
    }
}
