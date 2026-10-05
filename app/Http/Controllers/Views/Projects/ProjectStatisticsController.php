<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Image;
use Biigle\MediaType;
use Biigle\Project;
use Biigle\Traits\ComputesAnnotationStatistics;
use Biigle\Video;
use Illuminate\Http\Request;

class ProjectStatisticsController extends Controller
{
    use ComputesAnnotationStatistics;

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


        $totalImages = Image::whereIn('images.volume_id', fn ($query) => $query->select('volume_id')
            ->from('project_volume')
            ->where('project_id', $project->id))->count();
        $imageVolumeStatistics = $this->getVolumeStatistics($project, 'image');

        $totalVideos = Video::whereIn('videos.volume_id', fn ($query) => $query->select('volume_id')
            ->from('project_volume')
            ->where('project_id', $project->id))->count();
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
        return $this->getAnnotationStatistics($type, fn ($query) => $query->whereIn("{$type}s.volume_id", fn ($query) => $query->select('volume_id')
            ->from('project_volume')
            ->where('project_id', $project->id)));
    }
}
