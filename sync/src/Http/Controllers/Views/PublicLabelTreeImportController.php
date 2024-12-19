<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;

class PublicLabelTreeImportController extends Controller
{
    /**
     * Shows the import admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $this->authorize('create', LabelTree::class);

        return view('sync::publicLabelTreeImport');
    }
}
