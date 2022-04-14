<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Reports\Report;
use Illuminate\Http\Response;
use Storage;

class ReportsController extends Controller
{
    /**
     * @apiDefine reportOwner Report Owner
     * The user must be the owner of the report.
     */

    /**
     * Shows the specified report file.
     *
     * @api {get} reports/:id Get a report file
     * @apiGroup Reports
     * @apiName ShowReport
     * @apiPermission reportOwner
     * @apiDescription Responds with the file.
     *
     * @apiParam {Number} id The report ID.
     *
     * @param int $id report id
     * @return mixed
     */
    public function show($id)
    {
        $report = Report::findOrFail($id);
        $this->authorize('access', $report);
        $report->touch();

        $disk = Storage::disk(config('reports.storage_disk'));

        if (!$disk->exists($report->getStorageFilename())) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $disk->download($report->getStorageFilename(), $report->filename);
    }

    /**
     * Delete a report.
     *
     * @api {delete} reports/:id Delete a report
     * @apiGroup Reports
     * @apiName DestroyReport
     * @apiPermission reportOwner
     *
     * @apiParam {Number} id The report ID.
     *
     * @param int $id report id
     * @return mixed
     */
    public function destroy($id)
    {
        $report = Report::findOrFail($id);
        $this->authorize('destroy', $report);
        $report->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'Report deleted.')
                ->with('messageType', 'success');
        }
    }
}
