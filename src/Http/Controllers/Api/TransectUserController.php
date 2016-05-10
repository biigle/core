<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use DB;
use Dias\Transect;
use Dias\User;
use Dias\Http\Controllers\Api\Controller;

class TransectUserController extends Controller
{
    /**
     * Show all users that have annotations in this transect
     *
     * @api {get} transects/:id/users Get all users that have annotations in this transect
     * @apiGroup Transects
     * @apiName TransectUsers
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID
     *
     * @apiSuccessExample {json} Success response:
     *
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->requireCanSee($transect);

        return User::whereExists(function ($query) use ($id) {
            $query->select(DB::raw(1))
                ->from('images')
                ->join('annotations', 'images.id', '=', 'annotations.image_id')
                ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('images.transect_id', $id)
                ->whereRaw('annotation_labels.user_id = users.id');
        })->get();
    }
}
