<?php

namespace Biigle\Http\Controllers\Api\Volumes\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationLabelController extends Controller
{
    /**
     * List the IDs of files having one or more annotations with the specified label.
     *
     * @api {get} volumes/:tid/files/filter/annotation-label/:lid Get files with a label
     * @apiGroup Volumes
     * @apiName VolumeFilesHasLabel
     * @apiPermission projectMember
     * @apiDescription Returns IDs of files having one or more annotations with the specified label. If there is an active annotation session, files with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} lid The label ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Request $request
     * @param  int  $tid
     * @param  int  $lid
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $tid, $lid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $session = $volume->getActiveAnnotationSession($request->user());

        if ($volume->isImageVolume()) {
            $model = new ImageAnnotation;
        } else {
            $model = new VideoAnnotation;
        }

        if ($session) {
            $query = $model::allowedBySession($session, $request->user());
        } else {
            $query = $model::getQuery();
        }

        $fileRelation = $model->file();
        $ownerKeyName = $fileRelation->getQualifiedOwnerKeyName();
        $labelsRelation = $model->labels();

        return $query
            ->join($labelsRelation->getRelated()->getTable(), $labelsRelation->getQualifiedParentKeyName(), '=', $labelsRelation->getQualifiedForeignKeyName())
            ->where($labelsRelation->getRelated()->label()->getQualifiedForeignKeyName(), $lid)
            ->join($fileRelation->getRelated()->getTable(), $fileRelation->getQualifiedForeignKeyName(), '=', $ownerKeyName)
            ->where($fileRelation->getRelated()->volume()->getQualifiedForeignKeyName(), $tid)
            ->select($ownerKeyName)
            ->distinct()
            ->pluck($ownerKeyName);
    }
}
