<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Illuminate\Http\Response;

class LargoJobController extends Controller
{
    /**
     * Check if a job to save a Largo session is still running
     *
     * @api {get} largo-jobs/:id Check if a Largo job is running
     * @apiGroup Largo
     * @apiName SHowLargoJob
     * @apiParam {Number} id The job ID.
     * @apiPermission user
     * @apiDescription A response code `200` means that the job is still running, `404` means the job is no longer running.
     *
     * @param string $uuid
     * @return \Illuminate\Http\Response
     */
    public function show($uuid)
    {
        if (!Volume::where('attrs->largo_job_id', $uuid)->exists()) {
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
