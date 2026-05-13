<?php

namespace Biigle\Policies;

use Biigle\AnnotationGuideline;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationGuidelinePolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can edit the given annotation guideline.
     */
    public function update(User $user, AnnotationGuideline $guideline): bool
    {
        return $this->remember("annotation-guideline-can-update-{$user->id}-{$guideline->id}", fn () => DB::table('project_user')
            ->where('project_id', $guideline->project_id)
            ->where('project_role_id', Role::adminId())
            ->where('user_id', $user->id)
            ->exists());
    }
}
