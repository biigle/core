<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Enums\Role;

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
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function index()
    {
        return collect(Role::cases())->map->toArray()->values();
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
    public function show($id): Role
    {
        $role = Role::tryFrom((int) $id);
        abort_if($role === null, 404);
        return $role;
    }
}
