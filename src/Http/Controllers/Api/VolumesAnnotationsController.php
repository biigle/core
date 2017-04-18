<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api;

use Biigle\Volume;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class VolumesAnnotationsController extends Controller
{
    /**
     * Show all annotations of the volume that have a specific label attached.
     *
     * @api {get} volumes/:tid/annotations/filter/label/:lid Get annotations with a specific label
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsFilterLabels
     * @apiParam {Number} tid The volume ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited and unordered.
     * @apiPermission projectMember
     * @apiDescription Returns a list of annotation IDs. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $tid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function filter(Request $request, Guard $auth, $tid, $lid)
    {
        $volume = Volume::findOrFail($tid);
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
            ->whereIn('annotations.image_id', function ($query) use ($tid) {
                $query->select('id')
                    ->from('images')
                    ->where('volume_id', $tid);
            })
            ->where('annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->pluck('annotations.id');
    }
}
