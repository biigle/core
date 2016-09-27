<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Transect;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\ExtendedReport;

class ExtendedReportController extends Controller
{
    /**
     * Generate an extended report
     *
     * @api {post} transects/:id/reports/extended Generate a new extended report
     * @apiGroup Transects
     * @apiName GenerateExtendedTransectReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area defined for the individual transects.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id transect id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, Guard $auth, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);
        $this->validate($request, ['exportArea' => 'boolean']);
        $report = new ExtendedReport($transect, [
            'restricted' => (bool) $request->input('exportArea', false),
        ]);
        $this->dispatch(new GenerateReportJob($report, $auth->user()));
    }
}
