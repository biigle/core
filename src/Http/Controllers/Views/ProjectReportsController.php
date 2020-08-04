<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Illuminate\Http\Response;

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
        $hasVideoVolume = $project->videoVolumes()->exists();
        $hasImageVolume = $project->imageVolumes()->exists();
        if (!$hasVideoVolume && !$hasImageVolume) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $this->authorize('access', $project);

        $types = ReportType::when($hasImageVolume, function ($query) {
                $query->where('name', 'like', 'Image%');
            })
            ->when($hasVideoVolume, function ($query) {
                $query->orWhere('name', 'like', 'Video%');
            })
            ->orderBy('name', 'asc')
            ->get();


        $hasExportArea = $project->imageVolumes()
            ->whereNotNull('attrs->export_area')
            ->exists();

        $labelTrees = $project->labelTrees()->with('labels', 'version')->get();

        return view('reports::projectReports', [
            'project' => $project,
            'reportTypes' => $types,
            'hasExportArea' => $hasExportArea,
            'hasImageVolume' => $hasImageVolume,
            'hasVideoVolume' => $hasVideoVolume,
            'labelTrees' => $labelTrees,
        ]);
    }
}
