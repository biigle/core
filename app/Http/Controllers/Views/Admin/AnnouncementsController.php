<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;
use Biigle\Announcement;

class AnnouncementsController extends Controller
{
    /**
     * Shows the admin announcements page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $announcements = Announcement::orderBy('created_at', 'desc')->paginate(20);

        return view('admin.announcements.index', [
            'announcements' => $announcements,
            'hasActive' => Announcement::active()->exists(),
        ]);
    }

    /**
     * Shows the admin new announcement page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('admin.announcements.create');
    }
}
