<?php

namespace Biigle\Modules\Volumes\Http\Controllers;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Volume;

class AdminController extends Controller
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

        return view('volumes::admin', compact('volumes'));
    }
}
