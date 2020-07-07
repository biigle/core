<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\User;
use Biigle\Role;
use Biigle\Project;
use Biigle\Services\Modules;
use Biigle\Http\Controllers\Controller;

class UsersController extends Controller
{
    /**
     * Shows the admin users page.
     *
     * @return \Illuminate\Http\Response
     */
    public function get()
    {
        $users = User::select('id', 'firstname', 'lastname', 'email', 'login_at', 'role_id', 'affiliation')
            // Orders by login_at in descending order (most recent first) but puts
            // users with login_at=NULL at the end.
            ->orderByRaw('login_at IS NULL, login_at DESC')
            ->orderBy('created_at', 'desc')
            ->paginate(100);

        $roleNames = [
            Role::adminId() => 'Admin',
            Role::editorId() => 'Editor',
            Role::guestId() => 'Guest',
        ];

        return view('admin.users', [
            'users' => $users,
            'roleClass' => $this->roleClassMap(),
            'roleNames' => $roleNames,
        ]);
    }

    /**
     * Shows the admin new user page.
     *
     * @return \Illuminate\Http\Response
     */
    public function newUser()
    {
        return view('admin.users.new');
    }

    /**
     * Shows the admin edit user page.
     *
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        return view('admin.users.edit')
            ->with('affectedUser', User::findOrFail($id))
            ->with('roles', [
                Role::admin(),
                Role::editor(),
                Role::guest(),
            ]);
    }

    /**
     * Shows the admin delete user page.
     *
     * @return \Illuminate\Http\Response
     */
    public function delete($id)
    {
        return view('admin.users.delete')
            ->with('affectedUser', User::findOrFail($id));
    }

    /**
     * Shows the user information page.
     *
     * @param Modules $modules
     * @param int $id User ID
     * @return \Illuminate\Http\Response
     */
    public function show(Modules $modules, $id)
    {
        $user = User::findOrFail($id);
        $roleClass = $this->roleClassMap($user->role_id);
        $values = $this->showProject($user);
        $values = array_merge($values, $modules->callControllerMixins('adminShowUser', ['user' => $user]));

        return view('admin.users.show', array_merge([
            'shownUser' => $user,
            'roleClass' => $roleClass,
        ], $values));
    }

    /**
     * Determines the Boostrap label class for a role label.
     *
     * @param int $id
     *
     * @return string|array
     */
    protected function roleClassMap($id = null)
    {
        $map = [
            Role::adminId() => 'danger',
            Role::editorId() => 'primary',
            Role::guestId() => 'default',
        ];

        if (!is_null($id)) {
            return $map[$id];
        }

        return $map;
    }

    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    protected function showProject(User $user)
    {
        $projectsTotal = Project::count();

        $creatorProjects = Project::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();
        $creatorCount = $creatorProjects->count();
        $creatorPercent = $creatorCount > 0 ? round($creatorCount / $projectsTotal * 100, 2) : 0;

        $memberProjects = Project::join('project_user', 'projects.id', '=', 'project_user.project_id')
            ->orderBy('projects.created_at', 'desc')
            ->where('project_user.user_id', $user->id)
            ->select('projects.id', 'projects.name')
            ->get();
        $memberCount = $memberProjects->count();
        $memberPercent = $memberCount > 0 ? round($memberCount / $projectsTotal * 100, 2) : 0;

        return compact('creatorProjects', 'creatorCount', 'creatorPercent', 'memberProjects', 'memberCount', 'memberPercent');
    }
}
