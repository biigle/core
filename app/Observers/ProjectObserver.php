<?php

namespace Biigle\Observers;

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Report;
use Biigle\Role;
use DB;
use Exception;

class ProjectObserver
{
    /**
     * A project must not be created without having a creator.
     */
    public function creating(Project $project)
    {
        if ($project->creator_id === null) {
            throw new Exception('Project creator must not be null when creating a new project.');
        }
    }

    /**
     * Handle actions for newly created projects.
     */
    public function created(Project $project)
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

    public function deleting(Project $project)
    {
        // Delete manually so the reference image files are cleaned.
        // Wrap in a transaction so DB::afterCommit() in the guideline model defers
        // storage deletion until the DB delete is committed.
        DB::transaction(fn () => $project->annotationGuideline?->delete());
    }

    /**
     * Update the source name of reports when the source is deleted.
     */
    public function deleted(Project $project)
    {
        Report::where('source_id', '=', $project->id)
            ->where('source_type', '=', Project::class)
            ->update([
                'source_name' => $project->name,
            ]);
    }
}
