<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Transect;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\BasicReport;

class BasicReportController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {post} transects/:id/reports/basic Generate a new basic annotation report
     * @apiGroup Transects
     * @apiName GenerateBasicTransectReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
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
        $report = new BasicReport($transect, [
            'restricted' => (bool) $request->input('exportArea', false),
        ]);
        $this->dispatch(new GenerateReportJob($report, $auth->user()));
    }
}
