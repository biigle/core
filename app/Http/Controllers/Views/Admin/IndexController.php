<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\User;
use Carbon\Carbon;
use Biigle\Http\Controllers\Controller;

class IndexController extends Controller
{
    /**
     * Shows the admin dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function get()
    {
        $allUsers = User::count();
        $activeUsers = User::where('login_at', '>', Carbon::now()->subMonth())->count();

        return view('admin.index', [
            'allUsers' => $allUsers,
            'activeUsers' => $activeUsers,
        ]);
    }
}
