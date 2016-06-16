<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;
use DB;
use Dias\Http\Controllers\Api\Controller;
use Dias\Transect;
use Dias\Modules\Ate\Jobs\Preprocess;

class AteController extends Controller
{
    /**
     * Preprocess a transect for use with ate
     *
     * @api {post} transect/:id/ate/preprocess Preprocess transect for use with ate
     * @apiGroup Transects
     * @apiName PreprocessForAte
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function preprocess($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);
        $this->dispatch(new Preprocess($transect));
        return "Job submitted please wait. An Email will be sent to you.";
    }
    
}
