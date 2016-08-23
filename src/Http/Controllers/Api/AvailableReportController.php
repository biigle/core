<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Modules\Export\AvailableReport;
use Dias\Http\Controllers\Api\Controller;

class AvailableReportController extends Controller
{
    /**
     * Retrieve a report from the filesystem
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
