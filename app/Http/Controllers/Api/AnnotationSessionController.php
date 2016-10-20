<?php

namespace Dias\Http\Controllers\Api;

use DB;
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
     * @apiParam (Optional attributes) {Boolean} force If there are annotations that would no longer belong to the annotation session any more because of the changes, the changes will be rejected unless this attribute is `true`.
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

        if ($request->has('starts_at')) {
            $newStartsAt = Carbon::parse($request->input('starts_at'))
                ->tz(config('app.timezone'));

            if (!$request->input('force') && $session->annotations()->where('created_at', '<', $newStartsAt)->exists()) {
                abort(400, 'Some annotations would no longer belong to this annotation session if the start date was updated. Use the force attribute to update anyway.');
            }

            $session->starts_at = $newStartsAt;
        }

        if ($request->has('ends_at')) {
            $newEndsAt = Carbon::parse($request->input('ends_at'))
                ->tz(config('app.timezone'));

            if (!$request->input('force') && $session->annotations()->where('created_at', '>=', $newEndsAt)->exists()) {
                abort(400, 'Some annotations would no longer belong to this annotation session if the end date was updated. Use the force attribute to update anyway.');
            }

            $session->ends_at = $newEndsAt;
        }

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

            if (!$request->input('force')) {
                $lostUsers = $session->users()->whereNotIn('id', $users)->pluck('id');

                if ($lostUsers->count() > 0) {
                    // Check if there are any annotations of the users that should no
                    // longer belong to the annotation session.
                    $wouldLooseAnnotations = $session->annotations()
                        ->whereExists(function ($query) use ($lostUsers) {
                            $query->select(DB::raw(1))
                                ->from('annotation_labels')
                                ->whereRaw('annotation_labels.annotation_id = annotations.id')
                                ->whereIn('annotation_labels.user_id', $lostUsers);
                        })
                        ->exists();

                    if ($wouldLooseAnnotations) {
                        abort(400, 'Some annotations would no longer belong to this annotation session if the users were updated. Use the force attribute to update anyway.');
                    }
                }
            }

            // count users of all attached projects that match the given user IDs
            $count = $session->transect->users()
                ->whereIn('id', $users)
                ->count();

            // Previous validation ensures that the user IDs are distinct so we can
            // validate the transect users using the count.
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
     * @apiParam (Optional attributes) {Boolean} force If there are annotations belonging to the annotation session, deletion will be rejected unless this attribute is `true`.
     *
     * @apiParamExample {json} Request example:
     * {
     *    "force": true
     * }
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $session = AnnotationSession::with('transect')->findOrFail($id);
        $this->authorize('update', $session->transect);
        $this->validate($request, AnnotationSession::$destroyRules);

        if (!$request->input('force') && $session->annotations()->exists()) {
            abort(400, 'There are annotations belonging to this annotation session. Use the force attribute to delete it anyway (the annotations will not be deleted).');
        }

        $session->delete();
    }
}
