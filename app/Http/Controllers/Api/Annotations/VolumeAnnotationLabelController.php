<?php

namespace Biigle\Http\Controllers\Api\Annotations;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use DB;

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

        if ($volume->isImageVolume()) {
            $model = new ImageAnnotation;
        } else {
            $model = new VideoAnnotation;
        }

        return Label::select('id', 'name', 'color', 'parent_id')
            ->whereExists(function ($query) use ($id, $model) {
                $fileRelation = $model->file();
                $labelsRelation = $model->labels();
                $labelsForeignKey = $labelsRelation->getRelated()->label()->getQualifiedForeignKeyName();
                // take only labels that are used in annotations of this volume
                $query->select(DB::raw(1))
                    ->from($fileRelation->getRelated()->getTable())
                    ->join($model->getTable(), $fileRelation->getQualifiedOwnerKeyName(), '=', $fileRelation->getQualifiedForeignKeyName())
                    ->join($labelsRelation->getRelated()->getTable(), $labelsRelation->getQualifiedParentKeyName(), '=', $labelsRelation->getQualifiedForeignKeyName())
                    ->where($fileRelation->getRelated()->volume()->getQualifiedForeignKeyName(), $id)
                    ->whereRaw("{$labelsForeignKey} = labels.id");
            })
            ->get();
    }
}
