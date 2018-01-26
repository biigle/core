<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\User;
use Biigle\Role;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Auth\Access\AuthorizationException;

class VolumeUserController extends Controller
{
    /**
     * Add a member to a volume.
     *
     * @api {post} volumes/:id/users Add a member
     * @apiGroup Volumes
     * @apiName StoreVolumesUsers
     * @apiPermission volumeAdmin
     * @apiDescription All volume members are volume admins.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiParam (Required attributes) {Number} id User ID of the new member
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('add-member', $volume);
        $this->validate($request, Volume::$addMemberRules);

        $volume->addMember(User::findOrFail($request->input('id')), Role::$admin);

        return $volume;
    }

    /**
     * Removes the specified member from the specified volume.
     *
     * @api {delete} volumes/:lid/users/:uid Remove a member
     * @apiGroup Volumes
     * @apiName DestroyVolumesUsers
     * @apiPermission volumeAdmin
     * @apiDescription The only admin of a volume can't remove themselves.
     *
     * @apiParam {Number} lid The volume ID.
     * @apiParam {Number} uid User ID of the member.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $lid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Guard $auth, $lid, $uid)
    {
        $volume = Volume::findOrFail($lid);
        $member = $volume->members()->findOrFail($uid);
        $this->authorize('remove-member', $volume);

        if (!$volume->memberCanBeRemoved($member)) {
            throw new AuthorizationException('The only admin cannot be removed from a volume.');
        }

        $volume->members()->detach($uid);
    }
}
