<?php

namespace Dias\Http\Controllers\Views\Admin;

use Dias\Http\Controllers\Controller;
use Dias\User;
use Dias\Role;

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

        return view('admin.users')
            ->with('users', $users);
    }

    /**
     * Shows the admin new user page.
     *
     * @return \Illuminate\Http\Response
     */
    public function new()
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
            ->with('user', User::findOrFail($id))
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
            ->with('user', User::findOrFail($id));
    }
}
