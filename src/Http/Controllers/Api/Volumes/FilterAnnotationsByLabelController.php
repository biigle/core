<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class FilterAnnotationsByLabelController extends Controller
{
    /**
     * Show all annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:vid/annotations/filter/label/:lid Get annotations with a specific label
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsFilterLabels
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiParam (Optional arguments) {Number} take Number of annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited and unordered.
     * @apiPermission projectMember
     * @apiDescription Returns a list of annotation IDs. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Guard $auth, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $user = $auth->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::query();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $vid)
            ->where('annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->select('annotations.id', 'annotations.created_at')
            ->distinct()
            ->pluck('annotations.id');
    }
}
