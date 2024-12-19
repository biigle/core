<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\MediaType;

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

        $mediaTypes = MediaType::pluck('id', 'name');

        return view('sync::export.index', compact('allowedExports', 'mediaTypes'));
    }
}
