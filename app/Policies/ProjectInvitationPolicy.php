<?php

namespace Biigle\Policies;

use Biigle\Role;
use Biigle\User;
use Biigle\ProjectInvitation;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProjectInvitationPolicy extends CachedPolicy
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
     * Determine if the user can delete the given invitation.
     *
     * @param  User  $user
     * @param  ProjectInvitation  $invitation
     * @return bool
     */
    public function destroy(User $user, ProjectInvitation $invitation)
    {
        return $this->remember("project-invitation-can-destroy-{$user->id}-{$invitation->project_id}", function () use ($user, $invitation) {
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->where('project_id', $invitation->project_id)
                ->where('project_role_id', Role::adminId())
                ->exists();
        });
    }
}
