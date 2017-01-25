<?php

namespace Biigle\Http\Controllers\Views\Admin;

use File;
use Biigle\Http\Controllers\Controller;

class LogsController extends Controller
{
    /**
     * Shows the available logfiles
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (!config('biigle.admin-logs')) {
            abort(404);
        }

        $logs = File::glob(storage_path('logs').'/*.log');
        $logs = array_map(function ($path) {
            return File::name($path);
        }, $logs);

        return view('admin.logs.index', compact('logs'));
    }

    /**
     * Shows a specific logfile
     *
     * @return \Illuminate\Http\Response
     */
    public function show($file)
    {
        if (!config('biigle.admin-logs')) {
            abort(404);
        }

        $path = storage_path('logs')."/{$file}.log";
        if (!File::exists($path)) {
            abort(404);
        }

        return view('admin.logs.show', [
            'file' => $file,
            'content' => File::get($path),
        ]);
    }
}
