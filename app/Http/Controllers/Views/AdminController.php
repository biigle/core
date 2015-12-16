<?php

namespace Dias\Http\Controllers\Views;

use Illuminate\Http\Request;
use Dias\User;

class AdminController extends Controller
{
    /**
     * Shows the admin dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('admin.index');
    }

    /**
     * Shows the admin users page.
     *
     * @return \Illuminate\Http\Response
     */
    public function users()
    {
        $users = User::select('id', 'firstname', 'lastname', 'email', 'login_at')
            ->orderBy('login_at', 'desc')
            ->get();

        return view('admin.users')
            ->with('users', $users);
    }

    /**
     * Shows the admin labels page.
     *
     * @return \Illuminate\Http\Response
     */
    public function labels()
    {
        return view('admin.labels');
    }
}
