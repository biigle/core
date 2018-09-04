<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\LabelTree;
use Biigle\Visibility;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelTreePolicy extends CachedPolicy
{
    const TABLE = 'label_tree_user';

    use HandlesAuthorization;

    /**
     * Intercept all checks.
     *
     * @param User $user
     * @param string $ability
     * @return bool|null
     */
    public function before($user, $ability)
    {
        if ($user->can('sudo')) {
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
        return $this->remember("label-tree-can-access-{$user->id}-{$tree->id}", function () use ($user, $tree) {
            return (int) $tree->visibility_id === Visibility::$public->id
                || DB::table(self::TABLE)
                    ->where('label_tree_id', $tree->id)
                    ->where('user_id', $user->id)
                    ->exists()
                || DB::table('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_project.label_tree_id', $tree->id)
                    ->exists();
        });
    }

    /**
     * Determine if the user can add labels to the given label tree.
     *
     * @param  User  $user
     * @param  LabelTree  $tree
     * @return bool
     */
    public function createLabel(User $user, LabelTree $tree)
    {
        return $this->remember("label-tree-can-create-label-{$user->id}-{$tree->id}", function () use ($user, $tree) {
            return DB::table(self::TABLE)
                ->where('label_tree_id', $tree->id)
                ->where('user_id', $user->id)
                ->whereIn('role_id', [Role::$admin->id, Role::$editor->id])
                ->exists();
        });
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
        return $this->remember("label-tree-can-update-{$user->id}-{$tree->id}", function () use ($user, $tree) {
            return DB::table(self::TABLE)
                ->where('label_tree_id', $tree->id)
                ->where('user_id', $user->id)
                ->where('role_id', Role::$admin->id)
                ->exists();
        });
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
        return $this->update($user, $tree);
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
        return $this->update($user, $tree);
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
        return $this->remember("label-tree-can-update-member-{$user->id}-{$tree->id}-{$member->id}", function () use ($user, $tree, $member) {
            return $user->id !== $member->id && $this->update($user, $tree);
        });
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
        return $this->remember("label-tree-can-remove-member-{$user->id}-{$tree->id}-{$member->id}", function () use ($user, $tree, $member) {
            $wantsToDeleteOwnMember = $user->id === $member->id && DB::table(self::TABLE)
                ->where('label_tree_id', $tree->id)
                ->where('user_id', $user->id)
                ->exists();

            return $wantsToDeleteOwnMember || $this->update($user, $tree);
        });
    }
}
