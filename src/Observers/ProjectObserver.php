<?php

namespace Biigle\Modules\Export\Observers;

use Biigle\Project;
use Biigle\Modules\Export\Report;

class ProjectObserver
{
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
