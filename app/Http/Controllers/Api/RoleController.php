<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Role;

class RoleController extends Controller
{
    /**
     * Shows all roles.
     *
     * @api {get} roles Get all user roles
     * @apiGroup Roles
     * @apiName IndexRoles
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "admin"
     *    },
     *    {
     *       "id": 2,
     *       "name": "editor"
     *    },
     *    {
     *       "id": 3,
     *       "name": "guest"
     *    }
     * ]
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index()
    {
        return Role::all();
    }

    /**
     * Displays the specified role.
     *
     * @api {get} roles/:id Get a user role
     * @apiGroup Roles
     * @apiName ShowRoles
     * @apiPermission user
     *
     * @apiParam {Number} id The user role ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "admin"
     * }
     *
     * @param  int  $id
     * @return Role
     */
    public function show($id)
    {
        return Role::findOrFail($id);
    }
}
