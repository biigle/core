<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Transect;
use Dias\Annotation;
use Dias\Http\Controllers\Api\Controller;

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
     * @apiDescription Returns a list of annotation IDs
     *
     * @param  int  $tid Transect ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function filter($tid, $lid)
    {
        $transect = Transect::findOrFail($tid);
        $this->authorize('access', $transect);
        $this->validate($this->request, ['take' => 'integer']);
        $take = $this->request->input('take');

        return Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->whereIn('annotations.image_id', function ($query) use ($tid) {
                $query->select('id')
                    ->from('images')
                    ->where('transect_id', $tid);
            })
            ->where('annotation_labels.label_id', $lid)
            ->when($take !== null, function ($query) use ($take) {
                return $query->orderBy('annotations.created_at', 'desc')
                    ->take($take);
            })
            ->pluck('annotations.id');
    }

}
