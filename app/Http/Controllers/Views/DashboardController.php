<?php

namespace Dias\Http\Controllers\Views;

class DashboardController extends Controller
{
    /**
     * Show the application dashboard to the user.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('dashboard')
            ->with('user', auth()->user());
    }
}
