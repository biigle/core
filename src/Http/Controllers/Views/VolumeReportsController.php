<?php

namespace Biigle\Modules\Reports\Http\Controllers\Views;

use Biigle\Role;
use Biigle\Project;
use Biigle\LabelTree;
use Illuminate\Http\Request;
use Biigle\Volume as BaseVolume;
use Biigle\Modules\Reports\Volume;
use Biigle\Modules\Reports\ReportType;
use Biigle\Http\Controllers\Views\Controller;

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
        $volume = BaseVolume::findOrFail($id);
        $this->authorize('access', $volume);
        $sessions = $volume->annotationSessions()->orderBy('starts_at', 'desc')->get();
        $types = ReportType::where('name', 'like', 'Annotations%')
            ->orWhere('name', 'like', 'ImageLabels%')
            ->get();

        $user = $request->user();

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = $volume->projects()->pluck('id');
        } else {
            // Array of all project IDs that the user and the volume have in common
            // and where the user is editor, expert or admin.
            $projectIds = Project::inCommon($user, $volume->id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        // All label trees that are used by all projects in which the user can edit in.
        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        return view('reports::volumeReports', [
            'projects' => $volume->projects,
            'volume' => Volume::convert($volume),
            'annotationSessions' => $sessions,
            'reportTypes' => $types,
            'labelTrees' => $labelTrees,
        ]);
    }
}
