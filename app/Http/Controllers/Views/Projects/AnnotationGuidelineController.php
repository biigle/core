<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Shape;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AnnotationGuidelineController extends Controller
{
    /**
     * Shows the annotation guideline page for the project.
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

        $isAdmin = $user->can('update', $project);

        $annotationGuideline = $project->annotationGuideline;

        if ($annotationGuideline) {
            $annotationGuideline->load('labels');
        } elseif (!$isAdmin) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->getRelationValue('pivot')->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        $labelTrees = $project->labelTrees()->with('labels', 'version')->get();

        $shapes = Shape::pluck('name', 'id');

        return view('projects.show.annotation-guideline', [
            'project' => $project,
            'user' => $user,
            'annotationGuideline' => $annotationGuideline,
            'isMember' => $isMember,
            'isAdmin' => $isAdmin,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'guideline',
            'labelTrees' => $labelTrees,
            'availableShapes' => $shapes,
        ]);
    }
}
