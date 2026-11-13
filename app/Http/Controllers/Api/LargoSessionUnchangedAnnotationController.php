<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Jobs\ApplyLargoSession;
use Cache;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LargoSessionUnchangedAnnotationController extends Controller
{
    /**
     * Get the annotations of a saved Largo session that were not changed.
     *
     * @api {get} largo-sessions/:uuid/unchanged-annotations Get unchanged annotations
     * @apiGroup Largo
     * @apiName IndexLargoSessionUnchangedAnnotations
     * @apiPermission user
     * @apiDescription Changes of a saved Largo session are skipped if they are not allowed by the annotation guideline or if labels of other users should be detached (without `force`). This endpoint returns the IDs of the annotations that were not changed. `guideline` and `other_user` indicate which of the reasons occurred. Only the user who saved the Largo session can access this information and only for one hour after the session was saved.
     *
     * @apiParam {String} uuid The Largo session ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "image_annotations": [1, 2, 3],
     *    "video_annotations": [],
     *    "guideline": true,
     *    "other_user": false
     * }
     *
     * @param Request $request
     * @param string $uuid
     *
     * @return array
     */
    public function index(Request $request, $uuid)
    {
        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey($uuid));

        // Don't reveal that a session of another user exists.
        if (is_null($unchanged) || $unchanged['user_id'] !== $request->user()->id) {
            abort(Response::HTTP_NOT_FOUND);
        }

        unset($unchanged['user_id']);

        return $unchanged;
    }
}
