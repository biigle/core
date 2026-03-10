<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\AnnotationStrategy;
use Biigle\Project;
use Biigle\AnnotationStrategyLabel;
use Biigle\Role;
use Biigle\Shape;
use Biigle\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AnnotationStrategyController extends Controller
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

        $annotationStrategy = AnnotationStrategy::where(['project' => $id])->first();
        $isAdmin = $user->role_id === Role::adminId() || !$user->can('sudo');

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->get();

        $shapes = Shape::pluck('name', 'id');

        if (!$annotationStrategy) {
            if ($isAdmin) {
                //TODO: here we should return create strategy version of  the page
                return view('projects.show.annotation-strategy', [
                    "project" => $project,
                    'user' => $user,
                    "annotationStrategy" => null,
                    "annotationStrategyLabels" => null,
                    'isMember' => $isMember,
                    'isAdmin' => $isAdmin,
                    'isPinned' => $isPinned,
                    'canPin' => $canPin,
                    'activeTab' => 'strategy',
                    'labelTrees' => $labelTrees,
                    'availableShapes' => $shapes,
                ]);
            }
            abort(Response::HTTP_NOT_FOUND);
        }

        $annotationStrategyLabels = $annotationStrategy->strategyLabels()->with('label')->get();

        //dd($annotationStrategyLabels[0]->label);

        return view('projects.show.annotation-strategy', [
                "project" => $project,
                'annotationStrategy' => $annotationStrategy->toArray(),
                "annotationStrategyLabels" => $annotationStrategyLabels,
                'user' => $user,
                'isMember' => $isMember,
                'isAdmin' => $isAdmin,
                'isPinned' => $isPinned,
                'canPin' => $canPin,
                'activeTab' => 'strategy',
                'labelTrees' => $labelTrees,
                'availableShapes' => $shapes,
        ]);
    }
}
