<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;

class LabelTreesController extends Controller
{
    /**
     * Show the label tree admin page.
     */
    public function index()
    {
        $trees = LabelTree::global()->get();

        return view('admin.label-trees', [
            'trees' => $trees,
        ]);
    }
}
