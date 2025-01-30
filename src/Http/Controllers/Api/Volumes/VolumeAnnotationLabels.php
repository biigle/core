<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
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
     * @apiDescription Returns a collection of annotation labels and their counts in the volume
     *
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "label_tree_id":1,
     * "count":10}]
     *
     * @param int $id Volume ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getVolumeAnnotationLabels(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');
        $isImageVolume = $volume->isImageVolume();

        $session = $volume->getActiveAnnotationSession($request->user());

        if ($session) {
            $query = $isImageVolume ? ImageAnnotation::allowedBySession($session, $request->user()) :
                VideoAnnotation::allowedBySession($session, $request->user());
        } else {
            $query = $isImageVolume ? ImageAnnotation::query() : VideoAnnotation::query();
        }

        if ($isImageVolume) {
            $labelQuery = $query
                ->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->join('labels', 'image_annotation_labels.label_id', '=', 'labels.id')
                ->join('images', 'image_annotations.image_id', '=', 'images.id')
                ->where('images.volume_id', '=', $id);
        } else {
            $labelQuery = $query
                ->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                ->join('labels', 'video_annotation_labels.label_id', '=', 'labels.id')
                ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                ->where('videos.volume_id', '=', $id);
        }

        return $labelQuery
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('image_annotation_labels.user_id', $request->user()->id);
                }
            })
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->selectRaw('labels.id, labels.name, labels.color, labels.label_tree_id, count(labels.id) as count')
            ->groupBy(['labels.id', 'labels.name', 'labels.color', 'labels.label_tree_id'])
            ->orderBy('labels.name')
            ->get();
    }
}
