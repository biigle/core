<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\ReportType;
use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use Illuminate\Http\Request;

class VolumeReportsController extends Controller
{
    /**
     * Show the volumes reports view.
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $sessions = $volume->annotationSessions()->orderBy('starts_at', 'desc')->get();
        $types = ReportType::when($volume->isImageVolume(), function ($query) {
                $query->where('name', 'like', 'Image%');
            })
            ->when($volume->isVideoVolume(), function ($query) {
                $query->where('name', 'like', 'Video%');
            })
            ->orderBy('name', 'asc')
            ->get();

        $user = $request->user();

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = $volume->projects()->pluck('id');
        } else {
            // Array of all project IDs that the user and the volume have in common.
            $projectIds = Project::inCommon($user, $volume->id)->pluck('id');
        }

        // All label trees that are used by all projects of which the user is also member.
        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        $hasIfdo = $volume->metadata_parser === IfdoParser::class;
        if ($volume->isImageVolume()) {
            $reportPrefix = 'Image';
        } else {
            $reportPrefix = 'Video';
        }

        return view('reports::volumeReports', [
            'projects' => $volume->projects,
            'volume' => $volume,
            'annotationSessions' => $sessions,
            'reportTypes' => $types,
            'labelTrees' => $labelTrees,
            'reportPrefix' => $reportPrefix,
            'hasIfdo' => $hasIfdo,
        ]);
    }
}
