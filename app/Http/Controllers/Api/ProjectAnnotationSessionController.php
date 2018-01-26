<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Project;
use Biigle\AnnotationSession;
use Illuminate\Http\Request;

class ProjectAnnotationSessionController extends Controller
{
    /**
     * Shows a list of all annotation sessions of the specified project.
     *
     * @api {get} projects/:id/annotation-sessions Get all annotation sessions
     * @apiGroup Projects
     * @apiName IndexAnnotationsSessions
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My first annotation session",
     *       "description": "This is my first annotation session lasting two days.",
     *       "project_id": 1,
     *       "created_at": "2016-09-05 13:52:30",
     *       "updated_at": "2016-09-05 13:52:30",
     *       "starts_at": "2016-09-05 00:00:00",
     *       "ends_at": "2016-09-07 00:00:00",
     *       "hide_other_users_annotations": true,
     *       "hide_own_annotations": false,
     *    }
     * ]
     *
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project->annotationSessions;
    }

    /**
     * Creates a new annotation session for the specified project.
     *
     * @api {post} projects/:id/annotation-sessions Create a new annotation session
     * @apiGroup Projects
     * @apiName StoreAnnotationSessions
     * @apiPermission projectAdmin
     *
     * @apiDescription Annotation session may not overlap in their active time period.
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required arguments) {String} name Name of the annotation session.
     * @apiParam (Required arguments) {Date} starts_at Day when the annotation session should start. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Biigle instance is used. This endpoint returns a special `starts_at_iso8601` attribute which is parseable independently from the timezone of the Biigle instance.
     * @apiParam (Required arguments) {Date} ends_at Day when the annotation session should end. The session ends once this day has started. You should use a date format that specifies your timezone (e.g. `2016-09-20T00:00:00.000+02:00`), otherwise the timezone of the Biigle instance is used. This endpoint returns a special `ends_at_iso8601` attribute which is parseable independently from the timezone of the Biigle instance.
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
     *    "hide_other_users_annotations": true
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *     "id": 1,
     *     "name": "My first annotation session",
     *     "description": "This is my first annotation session lasting two days.",
     *     "project_id": 1,
     *     "created_at": "2016-09-18 13:52:30",
     *     "updated_at": "2016-09-18 13:52:30",
     *     "starts_at": "2016-09-19 22:00:00",
     *     "starts_at_iso8601": "2016-09-19T22:00:00+0000",
     *     "ends_at": "2016-09-24 22:00:00",
     *     "ends_at_iso8601": "2016-09-24T22:00:00+0000",
     *     "hide_other_users_annotations": true,
     *     "hide_own_annotations": false
     * }
     *
     * @param Request $request
     * @param int $id project ID
     * @return Annotation
     */
    public function store(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $this->validate($request, AnnotationSession::$storeRules);

        $session = new AnnotationSession;
        $session->name = $request->input('name');
        $session->description = $request->input('description');
        $session->starts_at = $request->input('starts_at');
        $session->ends_at = $request->input('ends_at');
        $session->hide_other_users_annotations = $request->input('hide_other_users_annotations', false);
        $session->hide_own_annotations = $request->input('hide_own_annotations', false);

        if ($project->hasConflictingAnnotationSession($session)) {
            return $this->buildFailedValidationResponse($request, [
                'starts_at' => ['There already is an annotation session in this time period.'],
            ]);
        }

        $project->annotationSessions()->save($session);

        return $session;
    }
}
