<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyPinnedProject;
use Biigle\Http\Requests\StorePinnedProject;
use Illuminate\Http\Request;

class UserPinnedProjectController extends Controller
{
    /**
     * Shows all pinned projects of the user.
     *
     * @api {get} projects/pinned Get all pinned projects
     * @apiGroup Projects
     * @apiName IndexPinnedProjects
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Test Project",
     *       "description": "This is a test project.",
     *       "creator_id": 1,
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30"
     *    }
     * ]
     *
     * @param Request $request
     * @return mixed
     */
    public function index(Request $request)
    {
        return $request->user()->projects()->wherePivot('pinned', true)->get();
    }

    /**
     * Pin a project.
     *
     * @api {post} projects/:id/pin Pin a project
     * @apiGroup Projects
     * @apiName StorePinnedProject
     * @apiPermission projectMember
     * @apiDescription Pinned projects are displayed first on the dashboard.. Up to three projects can be pinned at the same time.
     *
     * @apiParam {Number} id The project ID.
     *
     * @param StorePinnedProject $request
     * @return mixed
     */
    public function store(StorePinnedProject $request)
    {
        $request
            ->user()
            ->projects()
            ->updateExistingPivot($request->project->id, ['pinned' => true]);

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect();
        }
    }

    /**
     * Unpin a project.
     *
     * @api {delete} projects/:id/pin Unpin a project.
     * @apiGroup Projects
     * @apiName DestroyPinnedProject
     * @apiPermission projectMember
     * @apiDescription Only pinned projects can be unpinned.
     *
     * @apiParam {Number} id The project ID.
     *
     * @param DestroyPinnedProject $request
     * @return mixed
     */
    public function destroy(DestroyPinnedProject $request)
    {
        $request
            ->user()
            ->projects()
            ->updateExistingPivot($request->project->id, ['pinned' => false]);

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect();
        }
    }
}
