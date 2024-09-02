<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Visibility;

class VisibilityController extends Controller
{
    /**
     * Shows all visibilities.
     *
     * @api {get} visibilities Get all visibilities
     * @apiGroup Visibilities
     * @apiName IndexVisibilities
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "public"
     *    },
     *    {
     *       "id": 2,
     *       "name": "private"
     *    }
     * ]
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index()
    {
        return Visibility::all();
    }

    /**
     * Displays the specified visibility.
     *
     * @api {get} visibilities/:id Get a visibility
     * @apiGroup Visibilities
     * @apiName ShowVisibilities
     * @apiPermission user
     *
     * @apiParam {Number} id The user visibility ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "public"
     * }
     *
     * @param  int  $id
     * @return Visibility
     */
    public function show($id)
    {
        return Visibility::findOrFail($id);
    }
}
