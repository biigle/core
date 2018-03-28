<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;

class AdminController extends Controller
{
    /**
     * Shows the export admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('sync::export.index');
    }
}
