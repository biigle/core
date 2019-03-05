<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Storage;
use Biigle\Modules\Reports\Report;
use League\Flysystem\FileNotFoundException;
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

        try {
            return Storage::disk(config('reports.storage_disk'))
                ->download($report->id, $report->filename);
        } catch (FileNotFoundException $e) {
            abort(404);
        }
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
