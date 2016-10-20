<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects;

use Dias\Project;
use Dias\Modules\Export\Http\Controllers\Api\ReportController;

abstract class ProjectReportController extends ReportController
{
    /**
     * Get the model to generate the report for
     *
     * @param int $id
     * @return mixed
     */
    protected function getModel($id)
    {
        return Project::findOrFail($id);
    }
}
