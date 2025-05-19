<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyLabelTreeUser;
use Biigle\Http\Requests\StoreLabelTreeUser;
use Biigle\Http\Requests\UpdateLabelTreeUser;

class LabelTreeUserController extends Controller
{
    /**
     * Add a member to a label tree.
     *
     * @api {post} label-trees/:id/users Add a member
     * @apiGroup Label Trees
     * @apiName StoreLabelTreesUsers
     * @apiPermission labelTreeAdmin
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiParam (Required attributes) {Number} id User ID of the new member
     * @apiParam (Required attributes) {Number} role_id ID of the role of the new member (admin or editor).
     *
     * @param StoreLabelTreeUser $request
     * @return \Biigle\LabelTree|\Illuminate\Http\RedirectResponse
     */
    public function store(StoreLabelTreeUser $request)
    {
        $request->tree->addMember($request->input('id'), $request->input('role_id'));

        if ($this->isAutomatedRequest()) {
            return $request->tree;
        }

        return $this->fuzzyRedirect()->with('saved', true);
    }

    /**
     * Updates a member of a label tree.
     *
     * @api {put} label-trees/:lid/users/:uid Update a member
     * @apiGroup Label Trees
     * @apiName UpdateLabelTreesUsers
     * @apiPermission labelTreeAdmin
     * @apiDescription If there is only one label tree admin left, the admin is not allowed to loose their admin role.
     *
     * @apiParam {Number} lid The label tree ID
     * @apiParam {Number} uid The user ID of the member
     *
     * @apiParam (Attributes that can be updated) {Number} role_id New role of the member (admin or editor)
     *
     * @param UpdateLabelTreeUser $request
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function update(UpdateLabelTreeUser $request)
    {
        if ($request->filled('role_id')) {
            $request->tree->updateMember($request->member, $request->input('role_id'));
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', true);
        }
    }

    /**
     * Removes the specified member from the specified label tree.
     *
     * @api {delete} label-trees/:lid/users/:uid Remove a member
     * @apiGroup Label Trees
     * @apiName DestroyLabelTreesUsers
     * @apiPermission labelTreeAdmin
     * @apiDescription Each user is also allowed to remove themselves from the label tree.
     * The only admin of a label tree can't remove themselves, though.
     *
     * @apiParam {Number} lid The label tree ID.
     * @apiParam {Number} uid User ID of the member.
     *
     * @param DestroyLabelTreeUser $request
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function destroy(DestroyLabelTreeUser $request)
    {
        $request->tree->members()->detach($request->member);

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('deleted', true);
        }
    }
}
