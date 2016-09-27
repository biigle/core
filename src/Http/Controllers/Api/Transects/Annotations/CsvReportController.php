<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Dias\Transect;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\CsvReport;

class CsvReportController extends Controller
{
    /**
     * Generate a machine readable report in CSV format
     *
     * @api {post} transects/:id/reports/annotations/full Generate a machine readable report (CSV)
     * @apiGroup Transects
     * @apiName GenerateCsvTransectReport
     * @apiParam (Optional arguments) {Boolean} restrict If `1`, restrict the report to the export area of the transect.
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
        $this->validate($request, ['restrict' => 'boolean']);
        $report = new CsvReport($transect, [
            'restricted' => (bool) $request->input('restrict', false),
        ]);
        $this->dispatch(new GenerateReportJob($report, $auth->user()));
    }
}
