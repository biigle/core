<?php

namespace Biigle\Modules\Export\Observers;

use Biigle\Project;
use Biigle\Modules\Export\Report;

class ProjectObserver
{
    /**
     * Remove association to reports of this project.
     *
     * @param \Biigle\Project $project
     */
    public function deleted($project)
    {
        Report::where('source_id', '=', $project->id)
            ->where('source_type', '=', Project::class)
            ->update([
                'source_id' => null,
                'source_type' => null,
            ]);
    }
}
