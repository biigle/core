<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Role;
use Biigle\Video;
use Illuminate\Http\Request;

class ProjectsController extends Controller
{
    /**
     * Shows the create project page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $this->authorize('create', Project::class);

        return view('projects.create');
    }

    /**
     * Shows the project index page.
     *
     * @deprecated This is a legacy route and got replaced by the global search.
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('search', ['t' => 'projects']);
    }

    /**
     * Shows the project show page v2.
     *
     * @param Request $request
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    protected function show(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $hidden = ['doi'];
        $volumes = $project->volumes()
            ->select('id', 'name', 'updated_at', 'media_type_id')
            ->with('mediaType')
            ->orderBy('created_at', 'desc')
            ->get()
            ->each(function ($item) use ($hidden) {
                $item->append('thumbnailUrl')
                    ->append('thumbnailsUrl')
                    ->makeHidden($hidden);
            });

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        return view('projects.show.volumes', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'volumes',
            'volumes' => $volumes,
        ]);
    }
}
