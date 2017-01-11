<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;

class LabelsController extends Controller {

    /**
     * Shows the admin labels page.
     *
     * @return \Illuminate\Http\Response
     */
    public function get()
    {
        return view('admin.labels');
    }
}
