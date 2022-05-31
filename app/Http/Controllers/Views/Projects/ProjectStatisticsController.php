<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ImageAnnotation;
use Biigle\Project;
use DB;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectStatisticsController extends Controller
{
    /**
     * Shows the project statistics page.
     *
     * @param Request $request
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        $baseQuery = ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->whereIn('images.volume_id', function ($query) use ($project) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $project->id);
            });

        $annotationTimeSeries = $baseQuery->clone()
            ->select('image_annotation_labels.user_id', DB::raw('count(image_annotation_labels.id)'), DB::raw('EXTRACT(YEAR from image_annotations.created_at)::integer as year'))
            ->groupBy('image_annotation_labels.user_id', 'year')
            ->get();

        $volumeAnnotations = $baseQuery->clone()
            ->select('images.volume_id', DB::raw('count(image_annotation_labels.id)'))
            ->groupBy('images.volume_id')
            ->get();

        $volumes = $project->volumes()->select('id', 'name')->get();

        return view('projects.show.statistics', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'statistics',
            'annotationTimeSeries' => $annotationTimeSeries,
        ]);
    }
}
