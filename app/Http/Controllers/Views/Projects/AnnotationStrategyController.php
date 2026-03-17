<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\AnnotationStrategy;
use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Role;
use Biigle\Shape;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AnnotationStrategyController extends Controller
{
    /**
     * Shows the project invitation page.
     *
     * @param Request $request
     * @param int $id Id of the project
     *
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\View\View
     */
    public function show(Request $request, int $id)
    {
        $project = Project::findOrFail($id);
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

        $isAdmin = $user->can('update', $project);

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->get();

        $shapes = Shape::pluck('name', 'id');

        if (!$annotationStrategy) {
            if ($isAdmin) {
                return view('projects.show.annotation-strategy', [
                    'project' => $project,
                    'user' => $user,
                    'annotationStrategy' => [],
                    'annotationStrategyLabels' => [],
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

        $annotationStrategyLabels = $annotationStrategy->strategyLabels()
            ->with('label')
            ->get()
            ->toArray();

        return view('projects.show.annotation-strategy', [
            'project' => $project,
            'annotationStrategy' => $annotationStrategy->toArray(),
            'annotationStrategyLabels' => $annotationStrategyLabels,
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
