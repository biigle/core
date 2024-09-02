<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;
use Biigle\Logging\LogManager;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;

class LogsController extends Controller
{
    /**
     * Shows the available logfiles.
     */
    public function index(Request $request)
    {
        if (!config('biigle.admin_logs')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $manager = new LogManager;

        if ($manager->isFile()) {
            $logs = $manager->getLogFilenames();
        } elseif ($manager->isRedis()) {
            $logLevel = $request->input('level', 'error');

            $perPage = 10;
            $messages = $manager->getRedisLogMessages($logLevel);
            $total = $messages->count();
            $paginator = new LengthAwarePaginator([], $total, $perPage);
            $paginator->setPath(LengthAwarePaginator::resolveCurrentPath());

            $messages = $messages
                ->reverse()
                ->skip(($paginator->currentPage() - 1) * $perPage)
                ->take($perPage)
                ->map(function ($message) {
                    if (is_array($message['datetime'])) {
                        $message['date'] = $message['datetime']['date'];
                    }

                    return $message;
                });

            $paginator->setCollection($messages);

            if ($request->has('level')) {
                $paginator->appends('level', $logLevel);
            }

            return view('admin.logs.index-redis', compact('paginator', 'logLevel'));
        } else {
            $logs = [];
        }


        return view('admin.logs.index', compact('logs'));
    }

    /**
     * Shows a specific logfile.
     */
    public function show($file)
    {
        if (!config('biigle.admin_logs')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $manager = new LogManager;

        if (!$manager->isFile() || !in_array($file, $manager->getLogFilenames())) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return view('admin.logs.show', [
            'file' => $file,
            'content' => $manager->getLogFileContent($file),
        ]);
    }
}
