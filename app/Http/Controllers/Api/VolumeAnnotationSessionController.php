<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\AnnotationSession;
use Biigle\Http\Requests\StoreAnnotationSession;
use Biigle\Volume;
use Illuminate\Validation\ValidationException;

class VolumeAnnotationSessionController extends Controller
{
    /**
     * Shows a list of all annotation sessions of the specified volume.
     *
     * @api {get} volumes/:id/annotation-sessions Get all annotation sessions
     * @apiGroup Volumes
     * @apiName IndexAnnotationsSessions
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My first annotation session",
     *       "description": "This is my first annotation session lasting two days.",
     *       "volume_id": 1,
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
     * @param int $id volume id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        return $volume->annotationSessions;
    }

    /**
     * Creates a new annotation session for the specified volume.
     *
     * @api {post} volumes/:id/annotation-sessions Create a new annotation session
     * @apiGroup Volumes
     * @apiName StoreAnnotationSessions
     * @apiPermission projectAdmin
     *
     * @apiDescription Annotation session may not overlap in their active time period.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required arguments) {String} name Name of the annotation session.
     * @apiParam (Required arguments) {Date} starts_at Day when the annotation session should start. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Biigle instance is used. This endpoint returns a special `starts_at_iso8601` attribute which is parseable independently from the timezone of the Biigle instance.
     * @apiParam (Required arguments) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Biigle instance is used. This endpoint returns a special `ends_at_iso8601` attribute which is parseable independently from the timezone of the Biigle instance.
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
     *     "volume_id": 1,
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
     * @param StoreAnnotationSession $request
     * @return AnnotationSession
     */
    public function store(StoreAnnotationSession $request)
    {
        $users = $request->input('users');
        // count users of all attached projects that match the given user IDs
        $count = $request->volume
            ->users()
            ->whereIn('id', $users)
            ->count();

        // Previous validation ensures that the user IDs are distinct so we can validate
        // the volume users using the count.
        if ($count !== count($users)) {
            throw ValidationException::withMessages([
                'users' => ['All users must belong to one of the projects, this volume is attached to.'],
            ]);
        }

        $session = new AnnotationSession;
        $session->name = $request->input('name');
        $session->description = $request->input('description');
        $session->starts_at = $request->input('starts_at');
        $session->ends_at = $request->input('ends_at');
        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', false);
        $session->hide_own_annotations = $request->input('hide_own_annotations', false);

        if ($request->volume->hasConflictingAnnotationSession($session)) {
            throw ValidationException::withMessages([
                'starts_at' => ['There already is an annotation session in this time period.'],
            ]);
        }

        $request->volume->annotationSessions()->save($session);
        $session->users()->attach($users);

        return $session->load('users');
    }
}
