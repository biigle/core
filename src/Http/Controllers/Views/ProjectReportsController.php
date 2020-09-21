<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectReportsController extends Controller
{
    /**
     * Show the project reports view.
     *
     * @param Request $request
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $showV1 = $request->user()->getSettings('project_overview_v1', false);

        if (!config('biigle.project_overview_v2_preview') || $showV1) {
            return $this->showV1($id);
        }

        return $this->showV2($request, $id);
    }

    /**
     * Show the old project reports view.
     *
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    protected function showV1($id)
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

    /**
     * Show the new project reports view.
     *
     * @param Request $request
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    protected function showV2(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $hasVideoVolume = $project->videoVolumes()->exists();
        $hasImageVolume = $project->imageVolumes()->exists();
        if (!$hasVideoVolume && !$hasImageVolume) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $this->authorize('access', $project);

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

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

        return view('reports::projectReportsV2', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'reports',
            'reportTypes' => $types,
            'hasExportArea' => $hasExportArea,
            'hasImageVolume' => $hasImageVolume,
            'hasVideoVolume' => $hasVideoVolume,
            'labelTrees' => $labelTrees,
        ]);
    }
}
