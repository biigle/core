<?php

namespace Dias\Modules\Transects\Http\Controllers\Api;

use Dias\Transect;
use Dias\Http\Controllers\Api\Controller;

class TransectUserController extends Controller
{
    /**
     * List the users of a transect
     *
     * @api {get} transects/:id/users Get all users
     * @apiGroup Transects
     * @apiName IndexTransectUsers
     * @apiPermission projectAdmin
     * @apiDescription Returns a list of all users associated with all projects of the transect
     *
     * @apiParam {Number} id The transect ID.
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
    public function index($id) {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);

        return $transect->users()
            ->select('id', 'firstname', 'lastname', 'email')
            ->get();
    }
}
