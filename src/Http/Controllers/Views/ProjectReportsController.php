<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Project;
use Biigle\Modules\Reports\ReportType;
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
        $hasVideo = $project->videos()->exists();
        $hasVolume = $project->volumes()->exists();
        if (!$hasVolume && !$hasVideo) {
            abort(404);
        }

        $this->authorize('access', $project);

        $types = ReportType::when($hasVolume, function ($query) {
                $query->where('name', 'like', 'Annotations%')
                    ->orWhere('name', 'like', 'ImageLabels%');
            })
            ->when($hasVideo, function ($query) {
                $query->orWhere('name', 'like', 'VideoAnnotations%');
            })
            ->get();


        $hasExportArea = $project->volumes()
            ->whereNotNull('attrs->export_area')
            ->exists();

        $labelTrees = $project->labelTrees()->with('labels', 'version')->get();

        return view('reports::projectReports', [
            'project' => $project,
            'reportTypes' => $types,
            'hasExportArea' => $hasExportArea,
            'hasVolume' => $hasVolume,
            'hasVideo' => $hasVideo,
            'labelTrees' => $labelTrees,
        ]);
    }
}
