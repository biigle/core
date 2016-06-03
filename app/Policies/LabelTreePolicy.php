<?php

namespace Dias\Policies;

use Dias\LabelTree;
use Dias\User;
use Dias\Role;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelTreePolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks
     *
     * @param User $user
     * @param string $ability
     * @return bool|null
     */
    public function before($user, $ability)
    {
        if ($user->isAdmin) {
            return true;
        }
    }

    /**
     * Determine if the given label tree can be accessed by the user.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function access(User $user, LabelTree $tree)
    {
        return $tree->members()
            ->where('id', $user->id)
            ->exists();
    }

    /**
     * Determine if the user can add labels to the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function addLabelTo(User $user, LabelTree $tree)
    {
        return $tree->members()
            ->where('id', $user->id)
            ->whereIn('label_tree_user.role_id', [Role::$admin->id, Role::$editor->id])
            ->exists();
    }

    /**
     * Determine if the user can remove labels from the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function removeLabelFrom(User $user, LabelTree $tree)
    {
        return $tree->members()
            ->where('id', $user->id)
            ->whereIn('label_tree_user.role_id', [Role::$admin->id, Role::$editor->id])
            ->exists();
    }

    /**
     * Determine if the given label tree can be updated by the user.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function update(User $user, LabelTree $tree)
    {
        return $tree->members()
            ->where('id', $user->id)
            ->where('label_tree_user.role_id', Role::$admin->id)
            ->exists();
    }

    /**
     * Determine if the given label tree can be deleted by the user.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function destroy(User $user, LabelTree $tree)
    {
        return $tree->members()
            ->where('id', $user->id)
            ->where('label_tree_user.role_id', Role::$admin->id)
            ->exists();
    }
}
