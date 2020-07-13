<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Volume;

class VolumesController extends Controller
{
    /**
     * Shows the volumes admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $volumes = Volume::select('id', 'name', 'updated_at')
            ->with(['projects' => function ($query) {
                $query->select('id', 'name');
            }])
            ->orderBy('updated_at', 'desc')
            ->paginate(100);

        return view('admin.volumes', compact('volumes'));
    }
}
