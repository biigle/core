<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ProjectStrategy;
use Biigle\Project;
use Biigle\ProjectStrategyLabel;
use Biigle\Role;
use Biigle\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectStrategyController extends Controller
{
    /**
     * Shows the project invitation page.
     *
     * @param Request $request
     * @param string $id Id of the project
     * @param bool $edit Id of the project
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\View\View
     */
    public function show(Request $request, int $id)
    {
        $project = Project::findOrFail($id);
        //TODO: validate?
        $user = $request->user();

        if (!$user->can('sudo')) {
            $this->authorize('access', $project);
        }

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->getRelationValue('pivot')->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        $projectStrategy = ProjectStrategy::find($id);
        $isAdmin = $user->role_id === Role::adminId() || !$user->can('sudo');
        if (!$projectStrategy) {
            if ($isAdmin) {
                //TODO: here we should return create strategy version of  the page
                return view('projects.show.project-strategy', [
                    "project" => $project,
                    'user' => $user,
                    "projectStrategy" => null,
                    "projectStrategyLabels" => null,
                    'isMember' => $isMember,
                    'isAdmin' => $isAdmin,
                    'isPinned' => $isPinned,
                    'canPin' => $canPin,
                    'activeTab' => 'strategy',
                    'editStrategy' => true,
                ]);
            }
            abort(Response::HTTP_NOT_FOUND);
        }

        $projectStrategyLabels = ProjectStrategyLabel::where("project_strategy", $projectStrategy->pluck('id'))->get();

        return view('projects.show.project-strategy', [
                "project" => $project,
                "projectStrategyLabels" => $projectStrategyLabels,
                'user' => $user,
                'isMember' => $isMember,
                'isAdmin' => $isAdmin,
                'isPinned' => $isPinned,
                'canPin' => $canPin,
                'activeTab' => 'strategy',
        ]);
    }

    /**
     * Creates a new annotation strategy.
     *
     * @api {post} projects Create a new project
     * @apiGroup ProjectStrategy
     * @apiName CreateProjectStrategy
     * @apiPermission editor
     * @apiDescription The user creating a new project will automatically become project admin.
     *
     * @apiParam (Required attributes) {String} name Name of the new project.
     * @apiParam (Required attributes) {String} description Description of the new project.
     *
     * @param StoreProject $request
     * @return Project|\Illuminate\Http\RedirectResponse
     */
    public function store($request)
    {
        $projectStrategy = new ProjectStrategy;
        $projectId = $request->input('project');
        $projectStrategy->project = $projectId;
        $projectStrategy->description = $request->input('description');
        $projectStrategy->save();

        return $this->fuzzyRedirect('project.project-strategy', $projectId);
    }
}
