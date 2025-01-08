<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\ReportType;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectReportsController extends Controller
{
    /**
     * Show the new project reports view.
     *
     * @param Request $request
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    protected function show(Request $request, $id)
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

        $hasIfdos = false;

        foreach ($project->volumes as $volume) {
            if ($volume->metadata_parser === IfdoParser::class) {
                $hasIfdos = true;
                break;
            }
        }

        return view('projects.reports', [
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
            'hasIfdos' => $hasIfdos,
        ]);
    }
}
