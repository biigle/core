<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Volume;
use Illuminate\Http\Request;
use Storage;

class LargoController extends Controller
{
    /**
     * Show the the Largo view for a volume.
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);

        if (!$request->user()->can('sudo')) {
            $this->authorize('edit-in', $volume);
        }

        if ($request->user()->can('sudo')) {
            // Global admins have no restrictions.
            $projects = $volume->projects;
        } else {
            // All projects that the user and the volume have in common
            // and where the user is editor, expert or admin.
            $projects = Project::inCommon($request->user(), $volume->id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->get();
        }

        // All label trees that are used by all projects which are visible to the user.
        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projects) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projects->pluck('id'));
            })
            ->get();

        $patchUrlTemplate = Storage::disk(config('largo.patch_storage_disk'))
            ->url(':prefix/:id.'.config('largo.patch_format'));

        $shapes = Shape::pluck('name', 'id');

        if (!$volume->isVideoVolume()) {
            $wholeframeId = Shape::wholeFrameId();
            unset($shapes[$wholeframeId]);
        }

        return view('largo.show', [
            'volume' => $volume,
            'projects' => $projects,
            'labelTrees' => $labelTrees,
            'target' => $volume,
            'patchUrlTemplate' => $patchUrlTemplate,
            'shapes' => $shapes,
        ]);
    }
}
