<?php

namespace Dias\Modules\Annotations\Http\Controllers\Api;

use DB;
use Dias\Transect;
use Dias\User;
use Dias\Http\Controllers\Api\Controller;

class TransectUserController extends Controller
{
    /**
     * Find a user in all users who have annotations in a transect
     *
     * @api {get} transects/:id/users/find/:pattern Find a user in all users who have annotations in a transect
     * @apiGroup Transects
     * @apiName TransectFindUser
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID
     * @apiParam {String} pattern Part of the user first name or last name
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "firstname": "Joe",
     *       "lastname": "User"
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "lastname": "User"
     *    }
     * ]
     *
     * @param  int  $id
     * @param  string  $pattern
     * @return \Illuminate\Http\Response
     */
    public function find($id, $pattern) {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        if (DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
            $operator = 'ilike';
        } else {
            $operator = 'like';
        }

        return User::select('id', 'firstname', 'lastname')
            ->where(function ($query) use ($operator, $pattern) {
                $query->where('firstname', $operator, "%{$pattern}%")
                    ->orWhere('lastname', $operator, "%{$pattern}%");
            })
            ->whereExists(function ($query) use ($id) {
                // take only labels that are used in annotations of this transect
                $query->select(DB::raw(1))
                    ->from('images')
                    ->join('annotations', 'images.id', '=', 'annotations.image_id')
                    ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->where('images.transect_id', $id)
                    ->whereRaw('annotation_labels.user_id = users.id');
            })
            ->take(10)
            ->get();
    }
}
