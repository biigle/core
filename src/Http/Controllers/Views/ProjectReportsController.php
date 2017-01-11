<?php

namespace Biigle\Modules\Export\Http\Controllers\Views;

use Biigle\Project;
use Biigle\Http\Controllers\Views\Controller;

class ProjectReportsController extends Controller
{
    /**
     * Show the project reports view.
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return view('export::projectReports', [
            'project' => $project,
        ]);
    }
}
