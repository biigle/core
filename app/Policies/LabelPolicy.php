<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Label;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelPolicy extends CachedPolicy
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
        if ($user->isAdmin) {
            return true;
        }
    }

    /**
     * Determine if the given label can be updated by the user.
     *
     * @param  User  $user
     * @param  Label  $label
     * @return bool
     */
    public function update(User $user, Label $label)
    {
        return $this->remember("label-can-update-{$user->id}-{$label->id}", function () use ($user, $label) {
            return DB::table(self::TABLE)
                ->where('label_tree_id', $label->label_tree_id)
                ->where('user_id', $user->id)
                ->whereIn('role_id', [Role::$admin->id, Role::$editor->id])
                ->exists();
        });
    }

    /**
     * Determine if the user can remove the given label.
     *
     * @param  User  $user
     * @param  Label  $label
     * @return bool
     */
    public function destroy(User $user, Label $label)
    {
        return $this->update($user, $label);
    }
}
