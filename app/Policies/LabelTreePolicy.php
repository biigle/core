<?php

namespace Dias\Policies;

use Dias\LabelTree;
use Dias\User;
use Dias\Role;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelTreePolicy
{
    const TABLE = 'label_tree_user';

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
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Determine if the user can add labels to the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function addLabel(User $user, LabelTree $tree)
    {
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->whereIn('role_id', [Role::$admin->id, Role::$editor->id])
            ->exists();
    }

    /**
     * Determine if the user can remove labels from the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function removeLabel(User $user, LabelTree $tree)
    {
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->whereIn('role_id', [Role::$admin->id, Role::$editor->id])
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
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->where('role_id', Role::$admin->id)
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
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->where('role_id', Role::$admin->id)
            ->exists();
    }

    /**
     * Determine if the user can add members to the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function addMember(User $user, LabelTree $tree)
    {
        return DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->where('role_id', Role::$admin->id)
            ->exists();
    }

    /**
     * Determine if the user can update the given member of the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @param  User  $member
     * @return bool
     */
    public function updateMember(User $user, LabelTree $tree, User $member)
    {
        return $user->id !== $member->id && DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->where('role_id', Role::$admin->id)
            ->exists();
    }

    /**
     * Determine if the user can remove the given member from the given label tree.
     *
     * Every member can remove themselves. Otherwise only admins are allowed to remove
     * members.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @param  User  $member
     * @return bool
     */
    public function removeMember(User $user, LabelTree $tree, User $member)
    {
        $wantsToDeleteOwnMember = $user->id === $member->id && DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->exists();
        return $wantsToDeleteOwnMember || DB::table(self::TABLE)
            ->where('label_tree_id', $tree->id)
            ->where('user_id', $user->id)
            ->where('role_id', Role::$admin->id)
            ->exists();
    }
}
