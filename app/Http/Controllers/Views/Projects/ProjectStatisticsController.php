<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ImageAnnotation;
use Biigle\Project;
use DB;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Biigle\Image;

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

        $totalImages = Image::whereIn('images.volume_id', function ($query) use ($project) {
            return $query->select('volume_id')
                ->from('project_volume')
                ->where('project_id', $project->id);
        })->count();
        
        //dataset, col1 == dataset2.col1
        $baseQuery = ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->whereIn('images.volume_id', function ($query) use ($project) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $project->id);
            });

        $annotatedImages = $baseQuery->clone()
            // ->select(DB::raw('distinct images.id'))
            ->count(DB::raw('DISTINCT images.id'));

        $annotationTimeSeries = $baseQuery->clone()
            ->leftJoin('users', 'users.id', '=', 'image_annotation_labels.user_id')
            ->select('image_annotation_labels.user_id', DB::raw("concat(users.firstname, ' ', users.lastname) as fullname"), DB::raw('count(image_annotation_labels.id)'), DB::raw('EXTRACT(YEAR from image_annotations.created_at)::integer as year'))
            ->groupBy('image_annotation_labels.user_id', 'fullname', 'year')
            ->get();

        $volumeAnnotations = $baseQuery->clone()
            ->leftJoin('users', 'users.id', '=', 'image_annotation_labels.user_id')
            ->select('image_annotation_labels.user_id', DB::raw("concat(users.firstname, ' ', users.lastname) as fullname"), DB::raw('count(image_annotation_labels.id)'), 'images.volume_id')
            ->groupBy('image_annotation_labels.user_id', 'fullname', 'images.volume_id')
            ->get();

        $volumeNames = $project->volumes()->select('id', 'name')->get();

        $annotationLabels = $baseQuery->clone()
            ->join('labels', 'labels.id', '=', 'image_annotation_labels.label_id')
            ->select('labels.id', 'labels.name', DB::raw('count(labels.id)'), 'labels.color')
            ->groupBy('labels.id')
            ->get();
        
        $imageAnnotationLabels = $baseQuery->clone()
            ->select('images.id', 'image_annotation_labels.label_id')
            ->distinct()
            ->get()
            ->groupBy('id');

        $sourceTargetLabels = [];

        foreach ($imageAnnotationLabels as $value) {
            foreach ($value as $label1) {
                foreach ($value as $label2) {
                    if ($label1->label_id === $label2->label_id) {
                        continue;
                    }
                    // set source : target relation
                    $id1 = min($label1->label_id, $label2->label_id);
                    $id2 = max($label1->label_id, $label2->label_id);
                    if(array_key_exists($id1, $sourceTargetLabels)) {
                        // append to end of array
                        $sourceTargetLabels[$id1][] = $id2;
                    } else {
                        // first entry
                        $sourceTargetLabels[$id1] = [$id2];
                    }
                }
            }
        }

        $sourceTargetLabels = array_map('array_unique', $sourceTargetLabels);
        $sourceTargetLabels = array_map('array_values', $sourceTargetLabels);

        // dd($sourceTargetLabels);
        
        

        return view('projects.show.statistics', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'statistics',
            'annotationTimeSeries' => $annotationTimeSeries,
            'volumeAnnotations' => $volumeAnnotations,
            'volumeNames' => $volumeNames,
            'annotatedImages' => $annotatedImages,
            'totalImages' => $totalImages,
            'annotationLabels' => $annotationLabels,
            'sourceTargetLabels' => collect($sourceTargetLabels),
        ]);
    }
}
