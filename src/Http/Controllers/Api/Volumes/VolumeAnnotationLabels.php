<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Label;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeAnnotationLabels extends Controller
{
    /**
     * Get all annotation labels and annotation count for a given volume
     * 
     * @api {get} volumes/:vid/label-count Get annotation labels with a annotation count
     * @apiGroup Volumes
     * @apiName test
     * @apiParam {Number} id The Volume ID
     * @apiPermission projectMember
     * @apiDescription Returns a collection of project image labels, and annotation label counts
     * 
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "parent_id":null,
     * "label_tree_id":1,
     * "source_id":null,
     * "label_source_id":null,
     * "uuid":"6d2e6061-9ed1-41df-92f0-4862d0d4b12e",
     * "count":10}]
     *
     * @param int $id Volume ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVolumeAnnotationLabels($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if ($volume->isImageVolume()) {
            $labelQuery = Label::query()
                ->join('image_annotation_labels', 'labels.id', '=', 'image_annotation_labels.label_id')
                ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', '=', $id);
        } else {
            $labelQuery = Label::query()
                ->join('video_annotation_labels', 'labels.id', '=', 'video_annotation_labels.label_id')
                ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
                ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->where('videos.volume_id', '=', $id);
        }

        return $labelQuery
            ->selectRaw('labels.id, labels.name, labels.color, labels.label_tree_id, count(labels.id) as count')
            ->groupBy(['labels.id', 'labels.name', 'labels.color', 'labels.label_tree_id'])
            ->orderBy('labels.name')
            ->get();
    }
}