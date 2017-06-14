<?php

namespace Biigle\Modules\Export\Http\Controllers\Api;

use Response;
use Biigle\Modules\Export\Report;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class ReportsController extends Controller
{
    /**
     * @apiDefine reportOwner Report Owner
     * The user must be the owner of the report.
     */

    /**
     * Shows the specified report file.
     *
     * @api {get} reports/:id Get the report file
     * @apiGroup Reports
     * @apiName ShowReport
     * @apiPermission reportOwner
     * @apiDescription Responds with the file.
     *
     * @apiParam {Number} id The report ID.
     *
     * @param int $id report id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $report = Report::findOrFail($id);
        $this->authorize('access', $report);
        $report->touch();

        return Response::download($report->getPath(), $report->getFilename());
    }
}
