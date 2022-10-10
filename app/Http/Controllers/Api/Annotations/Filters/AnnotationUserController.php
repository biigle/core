<?php

namespace Biigle\Http\Controllers\Api\Annotations\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationUserController extends Controller
{
    /**
     * List the IDs of images having one or more annotations of the specified user.
     *
     * @api {get} volumes/:tid/files/filter/annotation-user/:uid Get all images having annotations of a user
     * @apiGroup Volumes
     * @apiName VolumeImagesHasUser
     * @apiPermission projectMember
     * @apiDescription Returns IDs of images having one or more annotations of the specified user. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} uid The user ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Request $request
     * @param  int  $tid
     * @param  int  $uid
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $tid, $uid)
    {
        $volume = Volume::findOrFail($tid);
        $this->authorize('access', $volume);

        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($volume->isImageVolume()) {
            $model = new ImageAnnotation;
        } else {
            $model = new VideoAnnotation;
        }

        if ($session) {
            $query = $model::allowedBySession($session, $user);
        } else {
            $query = $model::getQuery();
        }

        $fileRelation = $model->file();
        $ownerKeyName = $fileRelation->getQualifiedOwnerKeyName();
        $labelsRelation = $model->labels();

        return $query->join($labelsRelation->getRelated()->getTable(), $labelsRelation->getQualifiedParentKeyName(), '=', $labelsRelation->getQualifiedForeignKeyName())
                ->where($labelsRelation->getRelated()->user()->getQualifiedForeignKeyName(), $uid)
                ->join($fileRelation->getRelated()->getTable(), $fileRelation->getQualifiedForeignKeyName(), '=', $ownerKeyName)
                ->where($fileRelation->getRelated()->volume()->getQualifiedForeignKeyName(), $tid)
                ->select($ownerKeyName)
                ->distinct()
                ->pluck($ownerKeyName);
    }
}
