<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\AnnotationGuideline;
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

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->getRelationValue('pivot')->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        $annotationGuideline = AnnotationGuideline::where(['project' => $id])->first();

        $isAdmin = $user->can('update', $project);

        $labelTrees = $project->labelTrees()->with('labels', 'version')->get();

        $shapes = Shape::pluck('name', 'id');

        if (!$annotationGuideline) {
            if ($isAdmin) {
                return view('projects.show.annotation-guideline', [
                    'project' => $project,
                    'user' => $user,
                    'annotationGuideline' => [],
                    'annotationGuidelineLabels' => [],
                    'isMember' => $isMember,
                    'isAdmin' => $isAdmin,
                    'isPinned' => $isPinned,
                    'canPin' => $canPin,
                    'activeTab' => 'guideline',
                    'labelTrees' => $labelTrees,
                    'availableShapes' => $shapes,
                ]);
            }
            abort(Response::HTTP_NOT_FOUND);
        }

        $annotationGuidelineLabels = $annotationGuideline->guidelineLabels()
            ->with('label')
            ->get()
            ->toArray();

        return view('projects.show.annotation-guideline', [
            'project' => $project,
            'annotationGuideline' => $annotationGuideline->toArray(),
            'annotationGuidelineLabels' => $annotationGuidelineLabels,
            'user' => $user,
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
