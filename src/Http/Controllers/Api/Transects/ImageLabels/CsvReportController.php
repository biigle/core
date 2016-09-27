<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\ImageLabels;

use Dias\Transect;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Transects\ImageLabels\CsvReport;

class CsvReportController extends Controller
{
    /**
     * Generate an image label report
     *
     * @api {post} transects/:id/reports/image-labels Generate a new image label report
     * @apiGroup Transects
     * @apiName GenerateImageLabelTransectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @param Guard $auth
     * @param int $id transect id
     * @return \Illuminate\Http\Response
     */
    public function store(Guard $auth, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);
        $this->dispatch(new GenerateReportJob(new CsvReport($transect), $auth->user()));
    }
}
