<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Transect;
use Dias\Annotation;

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

        return Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->whereIn('annotations.image_id', function ($query) use ($tid) {
                $query->select('id')
                    ->from('images')
                    ->where('transect_id', $tid);
            })
            ->where('annotation_labels.label_id', $lid)
            ->pluck('annotations.id');
    }

}
