<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;

class UserController extends Controller
{
    /**
     * List the users of a volume.
     *
     * @api {get} volumes/:id/users Get all users
     * @apiGroup Volumes
     * @apiName IndexVolumeUsers
     * @apiPermission projectMember
     * @apiDescription Returns a list of all users associated with all projects of the volume
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *      "id": 2,
     *     "firstname": "Brandi",
     *     "lastname": "Schmitt",
     *     "affiliation": "Ocean Research Centre"
     *   },
     *   {
     *     "id": 3,
     *     "firstname": "Samir",
     *     "lastname": "Mosciski",
     *     "affiliation": "Ocean Research Centre"
     *   },
     *   {
     *     "id": 4,
     *     "firstname": "Annabell",
     *     "lastname": "Ferry",
     *     "affiliation": "Ocean Research Centre"
     *   }
     * ]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->users()
            ->select('id', 'firstname', 'lastname', 'affiliation')
            ->get();
    }
}
