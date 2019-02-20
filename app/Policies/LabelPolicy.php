<?php

namespace Biigle\Policies;

use DB;
use Biigle\User;
use Biigle\Role;
use Biigle\Label;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelPolicy extends CachedPolicy
{
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
     * Determine if the given label can be updated by the user.
     *
     * @param  User  $user
     * @param  Label  $label
     * @return bool
     */
    public function update(User $user, Label $label)
    {
        return $this->remember("label-can-update-{$user->id}-{$label->label_tree_id}", function () use ($user, $label) {
            return DB::table('label_tree_user')
                ->where('label_tree_id', $label->label_tree_id)
                ->where('user_id', $user->id)
                ->whereIn('role_id', [Role::adminId(), Role::editorId()])
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
