<?php

namespace Biigle\Observers;

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Report;
use Biigle\Role;
use Exception;

class ProjectObserver
{
    /**
     * A project must not be created without having a creator.
     * @param \Biigle\Project $project
     * @return bool
     */
    public function creating($project)
    {
        if ($project->creator_id === null) {
            throw new Exception('Project creator must not be null when creating a new project.');
        }
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
        $project->addUserId($project->creator_id, Role::adminId());

        // add global label trees (used by default)
        $ids = LabelTree::global()
            ->pluck('id')
            ->all();
        $project->labelTrees()->attach($ids);
    }

    /**
     * Update the source name of reports when the source is deleted.
     *
     * @param \Biigle\Project $project
     */
    public function deleted($project)
    {
        Report::where('source_id', '=', $project->id)
            ->where('source_type', '=', Project::class)
            ->update([
                'source_name' => $project->name,
            ]);
    }
}
