<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class FilterAnnotationsByLabelController extends Controller
{
    /**
     * Show all annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:vid/annotations/filter/label/:lid Get annotations with a label
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsFilterLabels
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited and unordered.
     * @apiPermission projectMember
     * @apiDescription Returns a map of annotation IDs to their image UUIDs. If there is an active annotation session, annotations hidden by the session are not returned.
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $session = $volume->getActiveAnnotationSession($request->user());

        if ($session) {
            $query = Annotation::allowedBySession($session, $request->user());
        } else {
            $query = Annotation::query();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $vid)
            ->where('annotation_labels.label_id', $lid)
            ->when($session, function ($query) use ($session, $request) {
                if ($session->hide_other_users_annotations) {
                    $query->where('annotation_labels.user_id', $request->user()->id);
                }
            })
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('images.uuid', 'annotations.id')
            ->distinct()
            ->orderBy('annotations.id', 'desc')
            ->pluck('images.uuid', 'annotations.id');
    }
}
