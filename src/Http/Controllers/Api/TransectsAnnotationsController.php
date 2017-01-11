<?php

namespace Biigle\Modules\Ate\Http\Controllers\Api;

use Biigle\Transect;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class TransectsAnnotationsController extends Controller
{
    /**
     * Show all annotations of the transect that have a specific label attached
     *
     * @api {get} transects/:tid/annotations/filter/label/:lid Get annotations with a specific label
     * @apiGroup Transects
     * @apiName ShowTransectsAnnotationsFilterLabels
     * @apiParam {Number} tid The transect ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited and unordered.
     * @apiPermission projectMember
     * @apiDescription Returns a list of annotation IDs. If there is an active annotation session, images with annotations hidden by the session are not returned.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $tid Transect ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function filter(Request $request, Guard $auth, $tid, $lid)
    {
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $user = $auth->user();
        $session = $transect->getActiveAnnotationSession($user);

        if ($session) {
            $query = Annotation::allowedBySession($session, $user);
        } else {
            $query = Annotation::query();
        }

        return $query->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->whereIn('annotations.image_id', function ($query) use ($tid) {
                $query->select('id')
                    ->from('images')
                    ->where('transect_id', $tid);
            })
            ->where('annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->pluck('annotations.id');
    }

}
