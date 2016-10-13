<?php

namespace Dias\Http\Controllers\Api;

use Carbon\Carbon;
use Dias\Transect;
use Dias\AnnotationSession;
use Illuminate\Http\Request;

class AnnotationSessionController extends Controller
{
    /**
     * Updates the annotation session
     *
     * @api {put} annotation-sessions/:id Update an annotation session
     * @apiGroup Transects
     * @apiName UpdateAnnotationSession
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The annotation session ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the annotation session.
     * @apiParam (Attributes that can be updated) {String} Short description of the annotation session.
     * @apiParam (Attributes that can be updated) {Date} starts_at Day when the annotation session should start. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. This endpoint returns a special `starts_at_iso8601` attribute which is parseable independently from the timezone of the Dias instance.
     * @apiParam (Attributes that can be updated) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. This endpoint returns a special `ends_at_iso8601` attribute which is parseable independently from the timezone of the Dias instance.
     * @apiParam (Attributes that can be updated) {Boolean} hide_other_users_annotations Whether to hide annotations of other users while the annotation session is active.
     * @apiParam (Attributes that can be updated) {Boolean} hide_own_annotations Whether to hide annotations of the own user that were created before the annotation session started while the annotation session is active.
     * @apiParam (Attributes that can be updated) {Number[]} users Array of user IDs of all users participating in the new annotation session. All other users won't be affected by the annotation session. This will completely replace the users previously associated with the annotation session.
     *
     * @apiParamExample {json} Request example:
     * {
     *    "name": "My first annotation session",
     *    "description": "This is my first annotation session lasting two days.",
     *    "starts_at": "2016-09-05T00:00:00.000+02:00",
     *    "ends_at": "2016-09-07T00:00:00.000+02:00",
     *    "hide_other_users_annotations": true,
     *    "hide_own_annotations": false,
     *    "users": [84, 2054]
     * }
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $session = AnnotationSession::with('transect')->findOrFail($id);
        $this->authorize('update', $session->transect);
        $this->validate($request, AnnotationSession::$updateRules);

        $session->starts_at = $request->input('starts_at', $session->starts_at);
        $session->ends_at = $request->input('ends_at', $session->ends_at);

        // can't do this with validate() because starts_at and ends_at may not both be
        // present in the request
        if ($session->ends_at <= $session->starts_at) {
            return $this->buildFailedValidationResponse($request, [
                'ends_at' => ['The end of an annotation session must be after its start.']
            ]);
        }

        if ($session->transect->hasConflictingAnnotationSession($session)) {
            return $this->buildFailedValidationResponse($request, [
                'starts_at' => ['There already is an annotation session in this time period.']
            ]);
        }

        if ($request->has('users')) {
            $users = $request->input('users');
            // count users of all attached projects that match the given user IDs
            $count = $session->transect->users()
                ->whereIn('id', $users)
                ->count();

            // Previous validation ensures that the user IDs are distinct so we can validate
            // the transect users using the count.
            if ($count !== count($users)) {
                return $this->buildFailedValidationResponse($request, [
                    'users' => ['All users must belong to one of the projects, this transect is attached to.']
                ]);
            }

            $session->users()->sync($users);
        }

        $session->name = $request->input('name', $session->name);
        $session->description = $request->input('description', $session->description);

        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', $session->hide_other_users_annotations);
        $session->hide_own_annotations = $request->input('hide_own_annotations', $session->hide_own_annotations);


        $session->save();
    }

    /**
     * Removes the annotation session.
     *
     * @api {delete} annotation-sessions/:id Delete an annotation session
     * @apiGroup Transects
     * @apiName DestroyAnnotationSession
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The annotation session ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $session = AnnotationSession::with('transect')->findOrFail($id);
        $this->authorize('update', $session->transect);
        $session->delete();
    }
}
