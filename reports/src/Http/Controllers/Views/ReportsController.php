<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;

class ReportsController extends Controller
{
    /**
     * Show the reports list of the user.
     *
     * @deprecated This is a legacy route and got replaced by the global search.
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('search', ['t' => 'reports']);
    }
}
