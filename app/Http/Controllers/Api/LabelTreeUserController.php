<?php

namespace Dias\Http\Controllers\Api;

use Dias\LabelTree;
use Dias\User;
use Dias\Role;
use Illuminate\Auth\Access\AuthorizationException;

class LabelTreeUserController extends Controller
{
    /**
     * Updates a member of a label tree
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
     * @param  int  $lid Label tree ID
     * @param  int  $uid User ID
     * @return \Illuminate\Http\Response
     */
    public function update($lid, $uid)
    {
        $tree = LabelTree::findOrFail($lid);
        $user = $tree->members()->findOrFail($uid);

        $this->authorize('update-member', [$tree, $user]);

        $this->validate($this->request, LabelTree::$updateMemberRules);

        if ($this->request->has('role_id')) {
            $tree->updateMember($user, Role::findOrFail($this->request->input('role_id')));
        }

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true);
        }
        return redirect()->back()
            ->with('saved', true);
    }

    /**
     * Add a member to a label tree
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
     * @return \Illuminate\Http\Response
     */
    public function store($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('add-member', $tree);

        $this->validate($this->request, LabelTree::$addMemberRules);

        $tree->addMember(
            User::findOrFail($this->request->input('id')),
            Role::findOrFail($this->request->input('role_id'))
        );

        if (static::isAutomatedRequest($this->request)) {
            return $tree;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('saved', true);
        }
        return redirect()->back()
            ->with('saved', true);
    }

    /**
     * Removes the specified member from the specified label tree
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
     * @param  int  $lid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function destroy($lid, $uid)
    {
        $tree = LabelTree::findOrFail($lid);
        $member = $tree->members()->findOrFail($uid);
        $this->authorize('remove-member', [$tree, $member]);

        // global admins can remove the last label tree admin so they can convert
        // ordinary label trees to global ones
        if (!$this->user->isAdmin && !$tree->memberCanBeRemoved($member)) {
            throw new AuthorizationException('The only admin cannot be removed from a label tree.');
        }

        $tree->members()->detach($uid);

        if (static::isAutomatedRequest($this->request)) {
            return;
        }

        if ($this->request->has('_redirect')) {
            return redirect($this->request->input('_redirect'))
                ->with('deleted', true);
        }
        return redirect()->back()
            ->with('deleted', true);
    }
}
