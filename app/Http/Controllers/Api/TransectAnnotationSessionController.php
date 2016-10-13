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
     *       "hide_own_annotations": false,
     *       "users": [
     *           {
     *               "id": 3,
     *               "firstname": "Chandler",
     *               "lastname": "Cruickshank",
     *               "email": "pamela71@dietrich.com"
     *           }
     *       ]
     *    }
     * ]
     *
     * @param int $id transect id
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
     * @apiParam (Required arguments) {Date} starts_at Day when the annotation session should start. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. This endpoint returns a special `starts_at_iso8601` attribute which is parseable independently from the timezone of the Dias instance.
     * @apiParam (Required arguments) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. This endpoint returns a special `ends_at_iso8601` attribute which is parseable independently from the timezone of the Dias instance.
     * @apiParam (Required arguments) {Number[]} users Array of user IDs of all users participating in the new annotation session. All other users won't be affected by the annotation session.
     *
     * @apiParam (Optional arguments) {String} description Short description of the annotation session.
     * @apiParam (Optional arguments) {Boolean} hide_other_users_annotations Whether to hide annotations of other users while the annotation session is active. Default is `false`.
     * @apiParam (Optional arguments) {Boolean} hide_own_annotations Whether to hide annotations of the own user that were created before the annotation session started while the annotation session is active. Default is `false`.
     *
     * @apiParamExample {JSON} Request example:
     * {
     *    "name": "My first annotation session",
     *    "description": "This is my first annotation session lasting two days.",
     *    "starts_at": "2016-09-20T00:00:00.000+02:00",
     *    "ends_at": "2016-09-25T00:00:00.000+02:00",
     *    "hide_other_users_annotations": true,
     *    "users": [1, 5]
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *     "id": 1,
     *     "name": "My first annotation session",
     *     "description": "This is my first annotation session lasting two days.",
     *     "transect_id": 1,
     *     "created_at": "2016-09-18 13:52:30",
     *     "updated_at": "2016-09-18 13:52:30",
     *     "starts_at": "2016-09-19 22:00:00",
     *     "starts_at_iso8601": "2016-09-19T22:00:00+0000",
     *     "ends_at": "2016-09-24 22:00:00",
     *     "ends_at_iso8601": "2016-09-24T22:00:00+0000",
     *     "hide_other_users_annotations": true,
     *     "hide_own_annotations": false,
     *     "users": [
     *        {
     *            "id": 1,
     *            "firstname": "Chandler",
     *            "lastname": "Cruickshank",
     *            "email": "pamela71@dietrich.com"
     *        },
     *        {
     *            "id": 5,
     *            "firstname": "Chromis P.",
     *            "lastname": "Bowerbird",
     *            "email": "chromis@structure.com"
     *        }
     *     ]
     * }
     *
     * @param Request $request
     * @param Guard $auth
     * @param int $id transect ID
     * @return Annotation
     */
    public function store(Request $request, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);
        $this->validate($request, AnnotationSession::$storeRules);

        $users = $request->input('users');
        // count users of all attached projects that match the given user IDs
        $count = $transect->users()
            ->whereIn('id', $users)
            ->count();

        // Previous validation ensures that the user IDs are distinct so we can validate
        // the transect users using the count.
        if ($count !== count($users)) {
            return $this->buildFailedValidationResponse($request, [
                'users' => ['All users must belong to one of the projects, this transect is attached to.']
            ]);
        }

        $session = new AnnotationSession;
        $session->name = $request->input('name');
        $session->description = $request->input('description');

        $session->starts_at = $request->input('starts_at');
        $session->ends_at = $request->input('ends_at');

        if ($transect->hasConflictingAnnotationSession($session)) {
            return $this->buildFailedValidationResponse($request, [
                'starts_at' => ['There already is an annotation session in this time period.']
            ]);
        }

        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', false);
        $session->hide_own_annotations = $request->input('hide_own_annotations', false);

        $transect->annotationSessions()->save($session);
        $session->users()->attach($users);

        return $session->load('users');
    }
}
