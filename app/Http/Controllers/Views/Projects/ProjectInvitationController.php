<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ProjectInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectInvitationController extends Controller
{
    /**
     * Instantiate a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        if (config('biigle.user_registration')) {
            $this->middleware('reg')->only('show');
        } else {
            $this->middleware('auth')->only('show');
        }
    }

    /**
     * Shows the project invitation page.
     *
     * @param Request $request
     * @param string $uuid Invitation UUID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $uuid)
    {
        $invitation = ProjectInvitation::where('uuid', $uuid)->firstOrFail();

        $isMember = $invitation->project
            ->users()
            ->where('user_id', $request->user()->id)
            ->exists();

        if ($isMember) {
            return redirect()->route('project', $invitation->project_id)
                ->with('message', 'You are already a member of the project.')
                ->with('messageType', 'info');
        }

        return view('projects.join', [
            'invitation' => $invitation,
            'project' => $invitation->project,
        ]);
    }
}
