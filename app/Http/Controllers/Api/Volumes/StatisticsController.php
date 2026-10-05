<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Traits\ComputesAnnotationStatistics;
use Biigle\Volume;

class StatisticsController extends Controller
{
    use ComputesAnnotationStatistics;

    /**
     * Provides the statistics-data for a specific Volume.
     *
     * @api {get} volumes/:id/statistics Get volume statistics
     * @apiGroup Volumes
     * @apiName IndexVolumesStatistics
     * @apiPermission projectMember
     * @apiDescription Returns a list of statistics-data associated to the volume
     *
     * @apiParam {Number} id The volume ID.
     *
     * @param  int  $id
     *
     * @return \Illuminate\Support\Collection
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if ($volume->isVideoVolume()) {
            $type = 'video';
        } else {
            $type = 'image';
        }

        $statistics = $this->getAnnotationStatistics($type, fn ($query) => $query->where("{$type}s.volume_id", $id));

        return collect([
            'annotatedFiles' => $statistics['annotatedFiles'],
            'annotationLabels' => $statistics['annotationLabels'],
            'annotationTimeSeries' => $statistics['annotationTimeSeries'],
            'sourceTargetLabels' => $statistics['sourceTargetLabels'],
            'totalFiles' => $volume->files()->count(),
            'volumeAnnotations' => $statistics['volumeAnnotations'],
            'volumeName' => [$volume->only('id', 'name')],
            'volumeType' => $type,
        ]);
    }
}
