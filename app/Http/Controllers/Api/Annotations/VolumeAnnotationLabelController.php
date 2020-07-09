<?php

namespace Biigle\Http\Controllers\Api\Annotations;

use DB;
use Biigle\Label;
use Biigle\Volume;
use Biigle\Http\Controllers\Api\Controller;

class VolumeAnnotationLabelController extends Controller
{
    /**
     * Get all annotation labels that were used in a volume.
     *
     * @api {get} volumes/:id/annotation-labels Get used labels
     * @apiGroup Volumes
     * @apiName VolumeIndexLabels
     * @apiPermission projectMember
     * @apiDescription Returns all labels that have been used in a volume.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Benthic Object",
     *       "parent_id": null,
     *       "color": "0099ff"
     *    },
     *    {
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1,
     *       "color": "9900ff"
     *    }
     * ]
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return Label::select('id', 'name', 'color', 'parent_id')
            ->whereExists(function ($query) use ($id) {
                // take only labels that are used in annotations of this volume
                $query->select(DB::raw(1))
                    ->from('images')
                    ->join('annotations', 'images.id', '=', 'annotations.image_id')
                    ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->where('images.volume_id', $id)
                    ->whereRaw('annotation_labels.label_id = labels.id');
            })
            ->get();
    }
}
