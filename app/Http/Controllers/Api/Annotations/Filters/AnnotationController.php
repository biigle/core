<?php

namespace Biigle\Http\Controllers\Api\Annotations\Filters;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    /**
     * List the IDs of files having one or more annotations.
     *
     * @api {get} volumes/:id/files/filter/annotations Get files having annotations
     * @apiGroup Volumes
     * @apiName VolumeFilesHasAnnotation
     * @apiPermission projectMember
     * @apiDescription Returns IDs of files having one or more annotations. If there is an active annotation session, files with annotations hidden by the session are not returned.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [1, 5, 6]
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Support\Collection<int|string, mixed>
     */
    public function index(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
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

        return $query->join($fileRelation->getRelated()->getTable(), $fileRelation->getQualifiedForeignKeyName(), '=', $ownerKeyName)
            ->where($fileRelation->getRelated()->volume()->getQualifiedForeignKeyName(), $id)
            ->select($ownerKeyName)
            ->distinct()
            ->pluck($ownerKeyName);
    }
}
