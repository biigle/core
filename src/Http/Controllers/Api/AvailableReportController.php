<?php

namespace Biigle\Modules\Export\Http\Controllers\Api;

use Biigle\Modules\Export\AvailableReport;
use Biigle\Http\Controllers\Api\Controller;

/**
 * @deprecated Will be deleted after a grace period that still allows downloading of old
 * reports.
 */
class AvailableReportController extends Controller
{
    /**
     * Retrieve a report from the filesystem.
     *
     * @api {get} reports/:uid/:filename
     * @apiGroup Files
     * @apiName RetrieveProjectReport
     *
     * @apiParam {string} uid The report uid.
     * @apiParam {string} filename Filename of the downloaded file.
     *
     * @param string $uid report uid
     * @param string $filename Download filename
     * @return \Illuminate\Http\Response
     */
    public function show($uid, $filename)
    {
        $report = AvailableReport::findOrFail($uid);
        return response()
            ->download($report->path, $filename)
            ->deleteFileAfterSend(true);
    }
}
