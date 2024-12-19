<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\MediaType;

class ExportController extends Controller
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

        return view('export.index', compact('allowedExports', 'mediaTypes'));
    }
}
