<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\ProjectInvitation;
use Biigle\Role;
use Biigle\Http\Requests\StoreProjectInvitation;
use Biigle\Http\Requests\DestroyProjectInvitation;
use Ramsey\Uuid\Uuid;

class ProjectInvitationController extends Controller
{
    /**
     * Adds a new invitation to the project.
     *
     * @api {post} projects/:id/invitations Add a new invitation
     * @apiGroup Projects
     * @apiName StoreProjectInvitations
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {Date} expires_at The date on which the project invitation will expire.
     *
     * @apiParam (Optional attributes) {Number} max_uses The number of times this project invitation can be used to adda user to the project.
     * @apiParam (Required attributes) {Number} role_id ID of the user role the new project members should have. Invited usery may not become project admins. Default is "editor".
     *
     * @param StoreProjectInvitation $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreProjectInvitation $request)
    {
        return ProjectInvitation::create([
            'uuid' => Uuid::uuid4(),
            'project_id' => $request->project->id,
            'expires_at' => $request->input('expires_at'),
            'role_id' => $request->input('role_id', Role::editorId()),
            'max_uses' => $request->input('max_uses'),
        ]);
    }

    /**
     * Deletes a project invitation.
     *
     * @api {delete} project-invitations/:id Delete an invitation
     * @apiGroup Projects
     * @apiName DestroyProjectInvitations
     * @apiPermission projectDamin
     *
     * @apiParam {Number} id The invitation ID.
     *
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $invitation = ProjectInvitation::findOrFail($id);
        $this->authorize('destroy', $invitation);
        $invitation->delete();
    }
}
