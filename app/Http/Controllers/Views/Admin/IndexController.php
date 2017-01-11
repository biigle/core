<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;

class IndexController extends Controller
{
    /**
     * Shows the admin dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function get()
    {
        return view('admin.index');
    }
}
