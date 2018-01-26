<?php

namespace Biigle\Http\Controllers\Api\Traits;

use Exception;
use Biigle\User;
use Biigle\Project;

trait ValidatesAttachToProjectPermissions
{
    /**
     * Chack if the user is allowed to attach something to the project.
     *
     * @param User $user
     * @param Project $project
     * @throws Exception If the user is not allowed to attach something to the project.
     */
    protected function validateAttachToProject(User $user, Project $project)
    {
        if (!$user->can('update', $project)) {
            throw new Exception('You have no permission to attach a volume to this project.');
        }
    }
}
