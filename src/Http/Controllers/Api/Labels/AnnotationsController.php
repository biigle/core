<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Labels;

use Biigle\Annotation;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Illuminate\Http\Request;

class AnnotationsController extends Controller
{
    /**
     * Show annotations of a label.
     *
     * @api {get} labels/:id/annotations Get annotations with a label
     * @apiGroup Labels
     * @apiName ShowLabelAnnotations
     * @apiParam {Number} id The Label ID
     * @apiPermission user
     * @apiDescription Returns a map of annotation IDs to their image UUIDs. Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer']);

        return Annotation::visibleFor($request->user())
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->withLabel($label)
            ->when($request->filled('take'), function ($query) use ($request) {
                return $query->take($request->input('take'));
            })
            ->select('images.uuid', 'annotations.id')
            ->distinct()
            ->orderBy('annotations.id', 'desc')
            ->pluck('images.uuid', 'annotations.id');
    }
}
