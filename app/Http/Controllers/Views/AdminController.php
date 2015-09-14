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
        return view('admin.users')
            ->withUsers(
                User::select(['id', 'firstname', 'lastname', 'email', 'login_at'])->get()
            );
    }
}
