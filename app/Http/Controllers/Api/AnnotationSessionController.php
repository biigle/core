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
     * @apiParam (Attributes that can be updated) {Date} starts_at Day when the annotation session should start. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. The date returned by this endpoint is in the timezone of the Dias instance.
     * @apiParam (Attributes that can be updated) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Dias instance is used. The date returned by this endpoint is in the timezone of the Dias instance.
     * @apiParam (Attributes that can be updated) {Boolean} hide_other_users_annotations Whether to hide annotations of other users while the annotation session is active.
     * @apiParam (Attributes that can be updated) {Boolean} hide_own_annotations Whether to hide annotations of the own user that were created before the annotation session started while the annotation session is active.
     *
     * @apiParamExample {json} Request example:
     * {
     *    "name": "My first annotation session",
     *    "description": "This is my first annotation session lasting two days.",
     *    "starts_at": "2016-09-05T00:00:00.000+02:00",
     *    "ends_at": "2016-09-07T00:00:00.000+02:00",
     *    "hide_other_users_annotations": true,
     *    "hide_own_annotations": false
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

        $session->name = $request->input('name', $session->name);
        $session->description = $request->input('description', $session->description);

        $tz = config('app.timezone');
        if ($request->has('starts_at')) {
            $session->starts_at = Carbon::parse($request->input('starts_at'))->tz($tz);
        }

        if ($request->has('ends_at')) {
            $session->ends_at = Carbon::parse($request->input('ends_at'))->tz($tz);
        }

        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', $session->hide_other_users_annotations);
        $session->hide_own_annotations = $request->input('hide_own_annotations', $session->hide_own_annotations);

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
