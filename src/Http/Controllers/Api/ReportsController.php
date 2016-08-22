<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Project;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Support\Reports\Report;
use Dias\Modules\Export\Jobs\Annotations\GenerateFullReport;
use Dias\Modules\Export\Jobs\Annotations\GenerateBasicReport;
use Dias\Modules\Export\Jobs\Annotations\GenerateExtendedReport;
use Dias\Modules\Export\Jobs\ImageLabels\GenerateStandardReport;

class ReportsController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {post} projects/:id/reports/basic Generate a new basic report
     * @apiGroup Projects
     * @apiName GenerateBasicProjectReport
     * @apiParam (Optional arguments) {Boolean} restrict If `1`, restrict the report to the export area defined for the individual transects.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function basic(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->validate($request, ['restrict' => 'boolean']);
        $this->dispatch(new GenerateBasicReport(
            $project,
            $auth->user(),
            (bool) $request->input('restrict', false)
        ));
    }

    /**
     * Generate a extended report
     *
     * @api {post} projects/:id/reports/extended Generate a new extended report
     * @apiGroup Projects
     * @apiName GenerateExtendedProjectReport
     * @apiParam (Optional arguments) {Boolean} restrict If `1`, restrict the report to the export area defined for the individual transects.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function extended(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->validate($request, ['restrict' => 'boolean']);
        $this->dispatch(new GenerateExtendedReport(
            $project,
            $auth->user(),
            (bool) $request->input('restrict', false)
        ));
    }

    /**
     * Generate a full report
     *
     * @api {post} projects/:id/reports/full Generate a new full report
     * @apiGroup Projects
     * @apiName GenerateFullProjectReport
     * @apiParam (Optional arguments) {Boolean} restrict If `1`, restrict the report to the export area defined for the individual transects.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function full(Request $request, Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->validate($request, ['restrict' => 'boolean']);
        $this->dispatch(new GenerateFullReport(
            $project,
            $auth->user(),
            (bool) $request->input('restrict', false)
        ));
    }

    /**
     * Generate an image label report
     *
     * @api {post} projects/:id/reports/image-labels Generate a new image label report
     * @apiGroup Projects
     * @apiName GenerateImageLabelProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function storeImageLabelReport(Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->dispatch(new GenerateStandardReport($project, $auth->user()));
    }

    /**
     * Retrieve report from filesystem
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
        $report = new Report($uid);
        if ($report->exists()) {
            return response()
                ->download($report->path, $filename)
                ->deleteFileAfterSend(true);
        } else {
            abort(404);
        }
    }
}
