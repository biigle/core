<?php

namespace Biigle\Modules\Volumes\Http\Controllers;

use Biigle\Role;
use Biigle\User;
use Biigle\Volume;
use Carbon\Carbon;
use Biigle\Project;
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
        $disks = array_intersect(array_keys(config('filesystems.disks')), config('volumes.browser_disks'));

        return view('volumes::create', [
            'project' => $project,
            'mediaTypes' => MediaType::all(),
            'hasBrowser' => config('volumes.browser'),
            'disks' => $disks,
        ]);
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

        $projects = $this->getProjects($user, $volume);

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

        return view('volumes::show')
            ->with('user', $user)
            ->with('volume', $volume)
            ->with('labelTrees', $labelTrees)
            ->with('projects', $projects)
            ->with('imageIds', $imageIds);
    }

    /**
     * Shows the volume edit page.
     *
     * @param Guard $auth
     * @param int $id volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function edit(Guard $auth, $id)
    {
        $volume = Volume::with('projects')->findOrFail($id);
        $this->authorize('update', $volume);
        $sessions = $volume->annotationSessions()->with('users')->get();
        $user = $auth->user();
        $projects = $this->getProjects($user, $volume);

        return view('volumes::edit', [
            'projects' => $projects,
            'volume' => $volume,
            'images' => $volume->orderedImages()->pluck('filename', 'id'),
            'mediaTypes' => MediaType::all(),
            'annotationSessions' => $sessions,
            'today' => Carbon::today(),
        ]);
    }

    /**
     * Get all projects that belong to a volume and that the user can access
     *
     * @param User $user
     * @param Volume $volume
     *
     * @return Collection
     */
    protected function getProjects(User $user, Volume $volume)
    {
        if ($user->isAdmin) {
            // admins have no restrictions
            return $volume->projects;
        }

        // all projects that the user and the volume have in common
        return $user->projects()
            ->whereIn('id', function ($query) use ($volume) {
                $query->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                    ->where('project_volume.volume_id', $volume->id)
                    ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
            })
            ->get();
    }
}
