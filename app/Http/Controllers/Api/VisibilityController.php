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
     * @return \Illuminate\Support\Collection
     */
    public function index()
    {
        return collect(Visibility::cases())->map->toArray()->values();
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
        $visibility = Visibility::tryFrom((int) $id);
        abort_if($visibility === null, 404);
        return $visibility;
    }
}
