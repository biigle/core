<?php

namespace Biigle\Observers;

use Exception;
use Biigle\Role;
use Biigle\LabelTree;
use Biigle\Visibility;

class ProjectObserver
{
    /**
     * A project must not be created without having a creator.
     * @param \Biigle\Project $project
     * @return bool
     */
    public function creating($project)
    {
        if ($project->creator === null) {
            throw new Exception('Project creator must not be null when creating a new project.');
        }

        return true;
    }

    /**
     * Handle actions for newly created projects.
     *
     * @param \Biigle\Project $project
     * @return void
     */
    public function created($project)
    {
        // set creator as project admin
        // this must be done *after* the project is saved so it already has an id
        $project->addUserId($project->creator->id, Role::$admin->id);

        // add global label trees (used by default)
        $ids = LabelTree::whereDoesntHave('members')
            ->where('visibility_id', Visibility::$public->id)
            ->pluck('id');
        $project->labelTrees()->attach($ids->toArray());
    }
}
