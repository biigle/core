<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use DB;

class StatisticsController extends Controller
{
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
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $volumeName = $volume->select('id', 'name')->get();

        if ($volume->isVideoVolume()) {
            $type = 'video';
        } else {
            $type = 'image';
        }

        $baseQuery = DB::table("{$type}_annotations")
            ->join("{$type}_annotation_labels", "{$type}_annotation_labels.annotation_id", '=', "{$type}_annotations.id")
            ->join("{$type}s", "{$type}s.id", '=', "{$type}_annotations.{$type}_id")
            ->where("{$type}s.volume_id", $id);

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

        return collect([
            'annotatedFiles' => $annotatedFiles,
            'annotationLabels' => $annotationLabels,
            'annotationTimeSeries' => $annotationTimeSeries,
            'sourceTargetLabels' => collect($sourceTargetLabels),
            'totalFiles' => $volume->files()->count(),
            'volumeAnnotations' => $volumeAnnotations,
            'volumeName' => [$volume->only('id', 'name')],
            'volumeType' => $type,
        ]);
    }
}
