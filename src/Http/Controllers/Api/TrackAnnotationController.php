<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use Queue;
use Biigle\Modules\Videos\Jobs\TrackObject;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Videos\Http\Requests\StoreTrackAnnotation;

class TrackAnnotationController extends Controller
{
    /**
     * Initiate object tracking for an annotation.
     *
     * @api {post} video-annotations/:id/track Initiate object tracking for an annotation.
     * @apiGroup Annotations
     * @apiName TrackVideoAnnotations
     * @apiPermission projectEditor
     * @apiDescription Only single frame annotations can be used with this endpoint. The annotation will be updated at some later time. You can poll the annotation endpoint and check for new frames or points.
     *
     * @apiParam {Number} id The video annotation ID.
     *
     * @param StoreTrackAnnotation $request
     * @return Annotation
     */
    public function store(StoreTrackAnnotation $request)
    {
        Queue::push(new TrackObject($request->annotation));
    }
}
