<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Image;
use Biigle\MediaType;
use Biigle\Project;
use Biigle\Video;
use DB;
use Illuminate\Http\Request;

class ProjectStatisticsController extends Controller
{
    /**
     * Shows the project statistics page.
     *
     * @param Request $request
     * @param int $id project ID
     */
    public function show(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->getRelationValue('pivot')->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        $volumes = $project->volumes()
            ->select('id', 'name', 'updated_at', 'media_type_id')
            ->with('mediaType')
            ->orderBy('created_at', 'desc')
            ->get();


        $totalImages = Image::whereIn('images.volume_id', function ($query) use ($project) {
            return $query->select('volume_id')
                ->from('project_volume')
                ->where('project_id', $project->id);
        })->count();
        $imageVolumeStatistics = $this->getVolumeStatistics($project, 'image');

        $totalVideos = Video::whereIn('videos.volume_id', function ($query) use ($project) {
            return $query->select('volume_id')
                ->from('project_volume')
                ->where('project_id', $project->id);
        })->count();
        $videoVolumeStatistics = $this->getVolumeStatistics($project, 'video');

        $volumeNames = $project->volumes()
            ->select('id', 'name')
            ->where('media_type_id', MediaType::imageId())
            ->get();

        $volumeNamesVideo = $project->volumes()
            ->select('id', 'name')
            ->where('media_type_id', MediaType::videoId())
            ->get();

        return view('projects.show.statistics', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'charts',
            'volumes' => $volumes,
            // IMAGES
            'annotatedImages' => $imageVolumeStatistics['annotatedFiles'],
            'annotationLabels' => $imageVolumeStatistics['annotationLabels'],
            'annotationTimeSeries' => $imageVolumeStatistics['annotationTimeSeries'],
            'sourceTargetLabels' => collect($imageVolumeStatistics['sourceTargetLabels']),
            'totalImages' => $totalImages,
            'volumeAnnotations' => $imageVolumeStatistics['volumeAnnotations'],
            'volumeNames' => $volumeNames,
            // VIDEOS
            'annotatedVideos' => $videoVolumeStatistics['annotatedFiles'],
            'annotationLabelsVideo' => $videoVolumeStatistics['annotationLabels'],
            'annotationTimeSeriesVideo' => $videoVolumeStatistics['annotationTimeSeries'],
            'sourceTargetLabelsVideo' => collect($videoVolumeStatistics['sourceTargetLabels']),
            'totalVideos' => $totalVideos,
            'volumeAnnotationsVideo' => $videoVolumeStatistics['volumeAnnotations'],
            'volumeNamesVideo' => $volumeNamesVideo,
        ]);
    }

    /**
     * Get the statistics of volumes with a certain media type.
     *
     * @param Project $project
     * @param string $type
     *
     * @return array
     */
    protected function getVolumeStatistics(Project $project, $type)
    {
        $baseQuery = DB::table("{$type}_annotations")
            ->join("{$type}_annotation_labels", "{$type}_annotation_labels.annotation_id", '=', "{$type}_annotations.id")
            ->join("{$type}s", "{$type}s.id", '=', "{$type}_annotations.{$type}_id")
            ->whereIn("{$type}s.volume_id", function ($query) use ($project) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $project->id);
            });

        $annotatedFiles = $baseQuery->clone()->count(DB::raw("DISTINCT {$type}s.id"));

        $annotationTimeSeries = $baseQuery->clone()
            ->leftJoin('users', 'users.id', '=', "{$type}_annotation_labels.user_id")
            ->selectRaw("{$type}_annotation_labels.user_id, concat(users.firstname, ' ', users.lastname) as fullname, count({$type}_annotation_labels.id), EXTRACT(YEAR from {$type}_annotations.created_at)::integer as year")
            ->groupBy("{$type}_annotation_labels.user_id", 'fullname', 'year')
            ->orderBy("{$type}_annotation_labels.user_id")
            ->get();

        $volumeAnnotations = $baseQuery->clone()
            ->leftJoin('users', 'users.id', '=', "{$type}_annotation_labels.user_id")
            ->selectRaw("{$type}_annotation_labels.user_id, concat(users.firstname, ' ', users.lastname) as fullname, count({$type}_annotation_labels.id), {$type}s.volume_id")
            ->groupBy("{$type}_annotation_labels.user_id", 'fullname', "{$type}s.volume_id")
            ->orderBy("{$type}_annotation_labels.user_id")
            ->get();

        $annotationLabels = $baseQuery->clone()
            ->join('labels', 'labels.id', '=', "{$type}_annotation_labels.label_id")
            ->select('labels.id', 'labels.name', DB::raw('count(labels.id)'), 'labels.color')
            ->groupBy('labels.id')
            ->orderBy('labels.id')
            ->get();

        $sourceTargetLabelsRaw = $baseQuery->clone()
            ->select("{$type}s.id", "{$type}_annotation_labels.label_id")
            ->distinct()
            ->get()
            ->groupBy('id');

        $sourceTargetLabels = [];

        foreach ($sourceTargetLabelsRaw as $value) {
            foreach ($value as $label1) {
                foreach ($value as $label2) {
                    if ($label1->label_id === $label2->label_id) {
                        continue;
                    }
                    // set source : target relation
                    $id1 = min($label1->label_id, $label2->label_id);
                    $id2 = max($label1->label_id, $label2->label_id);
                    if (array_key_exists($id1, $sourceTargetLabels)) {
                        // append to end of array $arr[]
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

        return [
            'annotatedFiles' => $annotatedFiles,
            'annotationLabels' => $annotationLabels,
            'annotationTimeSeries' => $annotationTimeSeries,
            'sourceTargetLabels' => collect($sourceTargetLabels),
            'volumeAnnotations' => $volumeAnnotations,
        ];
    }
}
