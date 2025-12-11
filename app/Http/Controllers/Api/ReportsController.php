<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Report;
use Biigle\ReportType;
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

        $path = $report->getStorageFilename();
        return $disk->download($path, $report->filename)
            // Use a custom fallback with fread() because the default fpassthru() could
            // lead to an out of memory error with large reports.
            ->setCallback(function () use ($disk, $path) {
                $stream = $disk->readStream($path);
                while (!feof($stream)) {
                    echo fread($stream, 8192);
                }
                fclose($stream);
            });
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

    /**
     * List all available report types.
     *
     * @api {get} reports List all available report types
     * @apiGroup Reports
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index()
    {
        return ReportType::all();
    }
}
