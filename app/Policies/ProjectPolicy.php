<?php

namespace Biigle\Policies;

use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProjectPolicy extends CachedPolicy
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
        $except = ['edit-in', 'force-edit-in'];

        if ($user->can('sudo') && !in_array($ability, $except)) {
            return true;
        }
    }

    /**
     * Determine if the given user can create projects.
     *
     * @param  User  $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->role_id === Role::editorId() || $user->role_id === Role::adminId();
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
        return $this->remember("project-can-access-{$user->id}-{$project->id}", fn () => $this->getBaseQuery($user, $project)->exists());
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
        return $this->remember("project-can-edit-in-{$user->id}-{$project->id}", function () use ($user, $project) {
            return $this->getBaseQuery($user, $project)
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->exists();
        });
    }

    /**
     * Determine if the user can edit things created by other users in the given project.
     *
     * @param  User  $user
     * @param  Project  $project
     * @return bool
     */
    public function forceEditIn(User $user, Project $project)
    {
        return $this->remember("project-can-force-edit-in-{$user->id}-{$project->id}", function () use ($user, $project) {
            return $this->getBaseQuery($user, $project)
                ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                ->exists();
        });
    }

    /**
     * Determine if user can remove the given project member from the given project.
     *
     * @param  User  $user
     * @param  Project  $project
     * @param User $member
     * @return bool
     */
    public function removeMember(User $user, Project $project, User $member)
    {
        return $this->remember("project-can-remove-member-{$user->id}-{$project->id}-{$member->id}", function () use ($user, $project, $member) {
            $isMember = $this->getBaseQuery($member, $project)->exists();

            if ($user->id === $member->id) {
                // each member is allowed to remove themselves
                return $isMember;
            } else {
                // admins can remove members other than themselves
                return $isMember && $this->getBaseQuery($user, $project)
                    ->where('project_role_id', Role::adminId())
                    ->exists();
            }
        });
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
        return $this->remember("project-can-update-{$user->id}-{$project->id}", function () use ($user, $project) {
            return $this->getBaseQuery($user, $project)
                ->where('project_role_id', Role::adminId())
                ->exists();
        });
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
        return $this->update($user, $project);
    }

    /**
     * Get the base query for all policy methods.
     *
     * @param User $user
     * @param Project $project
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function getBaseQuery(User $user, Project $project)
    {
        return DB::table('project_user')
            ->where('project_id', $project->id)
            ->where('user_id', $user->id);
    }
}
