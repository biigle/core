<?php

namespace Biigle\Http\Controllers\Views\Admin;

use File;
use Carbon\Carbon;
use Biigle\Logging\LogManager;
use Biigle\Http\Controllers\Controller;
use Illuminate\Pagination\LengthAwarePaginator;

class LogsController extends Controller
{
    /**
     * Shows the available logfiles.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (!config('biigle.admin_logs')) {
            abort(404);
        }

        $manager = new LogManager;

        if ($manager->isFile()) {
            $logs = $manager->getLogFilenames();
        } elseif ($manager->isRedis()) {
            $perPage = 10;
            $messages = $manager->getRedisLogMessages();
            $total = count($messages);
            $paginator = new LengthAwarePaginator([], $total, $perPage);
            $paginator->setPath(LengthAwarePaginator::resolveCurrentPath());

            $messages = collect($messages)
                ->reverse()
                ->skip(($paginator->currentPage() - 1) * $perPage)
                ->take($perPage)
                ->map(function ($message) {
                    return json_decode($message, true);
                });

            $paginator->setCollection($messages);

            return view('admin.logs.index-redis', compact('paginator'));
        } else {
            $logs = [];
        }


        return view('admin.logs.index', compact('logs'));
    }

    /**
     * Shows a specific logfile.
     *
     * @return \Illuminate\Http\Response
     */
    public function show($file)
    {
        if (!config('biigle.admin_logs')) {
            abort(404);
        }

        $manager = new LogManager;

        if (!$manager->isFile() || !in_array($file, $manager->getLogFilenames())) {
            abort(404);
        }

        return view('admin.logs.show', [
            'file' => $file,
            'content' => $manager->getLogFileContent($file),
        ]);
    }
}
