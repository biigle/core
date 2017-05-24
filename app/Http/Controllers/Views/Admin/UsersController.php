<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\User;
use Biigle\Role;
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
        $users = User::select('id', 'firstname', 'lastname', 'email', 'login_at', 'role_id')
            ->orderBy('login_at', 'desc')
            ->with('role')
            ->get();

        $activeUsers = $users->filter(function ($user) {
            return $user->login_at !== null;
        });

        $inactiveUsers = $users->filter(function ($user) {
            return $user->login_at === null;
        });

        return view('admin.users', [
            'activeUsers' => $activeUsers,
            'inactiveUsers' => $inactiveUsers,
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
            ->with('roles', Role::all());
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
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        if ($user->role_id === Role::$admin->id) {
            $roleClass = 'danger';
        } elseif ($user->role_id === Role::$editor->id) {
            $roleClass = 'primary';
        } else {
            $roleClass = 'default';
        }

        return view('admin.users.show', [
            'shownUser' => $user,
            'roleClass' => $roleClass,
        ]);
    }
}
