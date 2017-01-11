<?php

namespace Biigle\Modules\Transects\Http\Controllers;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Transect;

class AdminController extends Controller
{
    /**
     * Shows the transects admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $transects = Transect::select('id', 'name', 'updated_at')
            ->with(['projects' => function ($query) {
                $query->select('id', 'name');
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        return view('transects::admin', compact('transects'));
    }
}
