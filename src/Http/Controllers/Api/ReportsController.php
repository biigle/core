<?php

namespace Dias\Modules\Export\Http\Controllers\Api;
use DB;
use Dias\Http\Controllers\Api\Controller;
use Dias\Project;
use Dias\Modules\Export\Jobs\GenerateBasicReport;
use Dias\Modules\Export\Jobs\GenerateExtendedReport;
use Dias\Modules\Export\Jobs\GenerateFullReport;

class ReportsController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {post} projects/:id/reports/basic Generate a new report
     * @apiGroup Projects
     * @apiName GenerateBasicProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function basic($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateBasicReport($project, $this->user));
        return "Job submitted please wait. An Email will be sent to you.";
    }
    
    /**
     * Generate a extended report
     *
     * @api {post} projects/:id/reports/extended Generate a new report
     * @apiGroup Projects
     * @apiName GenerateExtendedProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function extended($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateExtendedReport($project,$this->user));
        return "Job submitted please wait. An Email will be sent to you.";
    }
    /**
     * Generate a full report
     *
     * @api {post} projects/:id/reports/full Generate a new report
     * @apiGroup Projects
     * @apiName GenerateFullProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function full($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);
        $this->dispatch(new GenerateFullReport($project,$this->user));
        return "Job submitted please wait. An Email will be sent to you.";
    }
    /**
     * Retrieve report from filesystem
     *
     * @api {post} files/retrieve/:uuid
     * @apiGroup Files
     * @apiName RetrieveProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Text} uuid The report uuid.
     *
     * @param int $uuid report uuid
     * @return \Illuminate\Http\Response
     */
    public function retrieveReport($uuid,$filename)
    {
        $results = DB::select('select path from files where id=?',[$uuid]);
        if ($results){
            $path = $results[0]->path;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime=finfo_file($finfo, $path);
            finfo_close($finfo);
            $file = file_get_contents($path);
            unlink($path);
            DB::delete("delete from files where id=?",[$uuid]);
            return response($file)->header("Content-Type",$mime);
        }else{
            return "The file is not available. Please check your uid.";
        }
    }
}
