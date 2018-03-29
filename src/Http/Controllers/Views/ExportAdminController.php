<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;

class ExportAdminController extends Controller
{
    /**
     * Shows the export admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $allowedExports = config('sync.allowed_exports');
        if (empty($allowedExports)) {
            abort(404);
        }

        return view('sync::export.index', compact('allowedExports'));
    }
}
