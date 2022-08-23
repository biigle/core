<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Biigle\ImageAnnotation;
use DB;

class StatisticsController extends Controller
{
    /**
     * Provides the statistics-data for a specific Volume.
     *
     * @api {get} volumes/:id Get a volume
     * @apiGroup Volumes
     * @apiName IndexVolumesStatistics
     * @apiPermission projectMember
     * @apiDescription Returns a list of statistics-data associated to the volume
     *
     * @apiParam {Number} id The volume ID.
     *
     *
     * @param  int  $id
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $totalImages = $volume->images()->count();
        
        //Structure: dataset, col1 == dataset2.col1
        $baseQuery = ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->where('images.volume_id', $id);

        //Debug: dd($baseQuery->get());
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

        $volumeName = $volume->select('id', 'name')->get();

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



        return collect([
            'annotationTimeSeries' => $annotationTimeSeries,
            'volumeAnnotations' => $volumeAnnotations,
            'volumeName' => $volumeName,
            'annotatedImages' => $annotatedImages,
            'totalImages' => $totalImages,
            'annotationLabels' => $annotationLabels,
            'sourceTargetLabels' => collect($sourceTargetLabels),
        ]);
    }
}
