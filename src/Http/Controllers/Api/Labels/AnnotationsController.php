<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Labels;

use Biigle\Label;
use Biigle\Annotation;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

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
     * @apiDescription Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Guard $auth, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer']);

        return Annotation::visibleFor($auth->user())
            ->withLabel($label)
            ->when($request->has('take'), function ($query) use ($request) {
                return $query->take($request->input('take'));
            })
            ->select('annotations.id')
            ->distinct()
            ->pluck('id');
    }
}
