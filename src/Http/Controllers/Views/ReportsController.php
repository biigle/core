<?php

namespace Biigle\Modules\Export\Http\Controllers\Views;

use Illuminate\Http\Request;
use Biigle\Modules\Export\Report;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Modules\Export\ReportType;
use Biigle\Http\Controllers\Views\Controller;

class ReportsController extends Controller
{
    /**
     * Show the reports list of the user.
     *
     * @param Request $request
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Guard $auth)
    {
        $reports = Report::where('user_id', '=', $auth->user()->id)
            ->orderBy('id', 'desc')
            ->paginate(10);

        return view('export::reports.index', [
            'reports' => $reports,
        ]);
    }
}
