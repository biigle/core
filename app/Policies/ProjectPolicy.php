<?php

namespace Dias\Policies;

use Dias\Project;
use Dias\User;
use Dias\Role;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProjectPolicy
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
     * Determine if the given project can be accessed by the user.
     *
     * @param  User  $user
     * @param  Project  $project
     * @return bool
     */
    public function access(User $user, Project $project)
    {
        return $project->users()->where('id', $user->id)->exists();
    }

    /**
     * Determine if the user can edit things in the given project.
     *
     * @param  User  $user
     * @param  Project  $project
     * @return bool
     */
    public function editIn(User $user, Project $project)
    {
        return $project->users()
            ->where('id', $user->id)
            ->whereIn('project_user.project_role_id', [Role::$admin->id, Role::$editor->id])
            ->exists();
    }

    /**
     * Determine if the given project can be updated by the user.
     *
     * @param  User  $user
     * @param  Project  $project
     * @return bool
     */
    public function update(User $user, Project $project)
    {
        return $project->users()
            ->where('id', $user->id)
            ->where('project_user.project_role_id', Role::$admin->id)
            ->exists();
    }

    /**
     * Determine if the given project can be deleted by the user.
     *
     * @param  User  $user
     * @param  Project  $project
     * @return bool
     */
    public function destroy(User $user, Project $project)
    {
        return $project->users()
            ->where('id', $user->id)
            ->where('project_user.project_role_id', Role::$admin->id)
            ->exists();
    }
}
