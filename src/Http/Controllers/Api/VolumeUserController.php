<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeUserController extends Controller
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
     *     "email": "nola50@mayert.com"
     *   },
     *   {
     *     "id": 3,
     *     "firstname": "Samir",
     *     "lastname": "Mosciski",
     *     "email": "caleigh.hammes@yahoo.com"
     *   },
     *   {
     *     "id": 4,
     *     "firstname": "Annabell",
     *     "lastname": "Ferry",
     *     "email": "selina35@gmail.com"
     *   }
     * ]
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->users()
            ->select('id', 'firstname', 'lastname', 'email')
            ->get();
    }
}
