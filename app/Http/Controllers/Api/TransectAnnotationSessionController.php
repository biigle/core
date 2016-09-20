<?php

namespace Dias\Http\Controllers\Api;

use Carbon\Carbon;
use Dias\Transect;
use Dias\AnnotationSession;
use Illuminate\Http\Request;

class TransectAnnotationSessionController extends Controller
{
    /**
     * Shows a list of all annotation sessions of the specified transect.
     *
     * @api {get} transects/:id/annotation-sessions Get all annotation sessions
     * @apiGroup Transects
     * @apiName IndexAnnotationsSessions
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My first annotation session",
     *       "description": "This is my first annotation session lasting two days.",
     *       "transect_id": 1,
     *       "created_at": "2016-09-05 13:52:30",
     *       "updated_at": "2016-09-05 13:52:30",
     *       "starts_at": "2016-09-05 00:00:00",
     *       "ends_at": "2016-09-07 00:00:00",
     *       "hide_other_users_annotations": true,
     *       "hide_own_annotations": false
     *    }
     * ]
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        return $transect->annotationSessions;
    }

    /**
     * Creates a new annotation session for the specified transect.
     *
     * @api {post} transects/:id/annotation-sessions Create a new annotation session
     * @apiGroup Transects
     * @apiName StoreAnnotationSessions
     * @apiPermission projectAdmin
     *
     * @apiDescription Annotation session may not overlap in their active time period.
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiParam (Required arguments) {String} name Name of the annotation session.
     * @apiParam (Required arguments) {Date} starts_at Day when the annotation session should start. Format `YYYY-MM-DD`.
     * @apiParam (Required arguments) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. Format `YYYY-MM-DD`.
     *
     * @apiParam (Optional arguments) {String} description Short description of the annotation session.
     * @apiParam (Optional arguments) {Boolean} hide_other_users_annotations Whether to hide annotations of other users while the annotation session is active. Default is `false`.
     * @apiParam (Optional arguments) {Boolean} hide_own_annotations Whether to hide annotations of the own user that were created before the annotation session started while the annotation session is active. Default is `false`.
     *
     * @apiParamExample {JSON} Request example:
     * {
     *    "name": "My first annotation session",
     *    "description": "This is my first annotation session lasting two days.",
     *    "starts_at": "2016-09-05",
     *    "ends_at": "2016-09-07",
     *    "hide_other_users_annotations": true
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *     "id": 1,
     *     "name": "My first annotation session",
     *     "description": "This is my first annotation session lasting two days.",
     *     "transect_id": 1,
     *     "created_at": "2016-09-05 13:52:30",
     *     "updated_at": "2016-09-05 13:52:30",
     *     "starts_at": "2016-09-05 00:00:00",
     *     "ends_at": "2016-09-07 00:00:00",
     *     "hide_other_users_annotations": true,
     *     "hide_own_annotations": false
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id image ID
     * @return Annotation
     */
    public function store(Request $request, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);
        $this->validate($request, AnnotationSession::$storeRules);

        $session = new AnnotationSession;
        $session->name = $request->input('name');
        $session->description = $request->input('description');
        $session->starts_at = $request->input('starts_at');
        $session->ends_at = $request->input('ends_at');
        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', false);
        $session->hide_own_annotations = $request->input('hide_own_annotations', false);

        if ($transect->hasConflictingAnnotationSession($session)) {
            return $this->buildFailedValidationResponse($request, [
                'starts_at' => ['There already is an annotation session in this time period.']
            ]);
        }

        $transect->annotationSessions()->save($session);
        return $session;
    }
}
