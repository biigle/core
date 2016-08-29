<?php

namespace Dias\Modules\Export\Http\Controllers;

use Dias\Http\Controllers\Views\Controller;

class TutorialController extends Controller
{
    /**
     * Show a tutorials article.
     *
     * @param string $name Article name
     * @return \Illuminate\Http\Response
     */
    public function show($name)
    {
        if (view()->exists('export::manual.tutorials.'.$name)) {
            return view('export::manual.tutorials.'.$name);
        } else {
            abort(404);
        }
    }
}
