<?php

namespace Biigle\Modules\Volumes\Http\Controllers;

use Biigle\Role;
use Biigle\Project;
use Biigle\Volume;
use Carbon\Carbon;
use Biigle\LabelTree;
use Biigle\MediaType;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class VolumeController extends Controller
{
    /**
     * Shows the create volume page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function create(Request $request)
    {
        $project = Project::findOrFail($request->input('project'));
        $this->authorize('update', $project);

        return view('volumes::create')
            ->with('project', $project)
            ->with('mediaTypes', MediaType::all());
    }

    /**
     * Shows the volume index page.
     *
     * @param Guard $auth
     * @param int $id volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $user = $auth->user();

        if ($user->isAdmin) {
            // admins have no restrictions
            $projects = $volume->projects;
        } else {
            // all projects that the user and the volume have in common
            $projects = $user->projects()
                ->whereIn('id', function ($query) use ($volume) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                        ->where('project_volume.volume_id', $volume->id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->get();
        }

        // all label trees that are used by all projects which are visible to the user
        $labelTrees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projects) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projects->pluck('id'));
            })
            ->get();

        $imageIds = $volume->orderedImages()
            ->pluck('uuid', 'id');

        return view('volumes::index')
            ->with('user', $user)
            ->with('volume', $volume)
            ->with('labelTrees', $labelTrees)
            ->with('projects', $projects)
            ->with('imageIds', $imageIds);
    }

    /**
     * Shows the volume edit page.
     *
     * @param int $id volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $volume = Volume::with('projects')->findOrFail($id);
        $this->authorize('update', $volume);
        $sessions = $volume->annotationSessions()->with('users')->get();

        return view('volumes::edit', [
            'volume' => $volume,
            'images' => $volume->orderedImages()->pluck('filename', 'id'),
            'mediaTypes' => MediaType::all(),
            'annotationSessions' => $sessions,
            'today' => Carbon::today(),
        ]);
    }
}
