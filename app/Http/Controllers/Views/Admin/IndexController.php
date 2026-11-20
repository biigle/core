<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;
use Biigle\ImageAnnotation;
use Biigle\Services\Modules;
use Biigle\User;
use Biigle\VideoAnnotation;
use Carbon\Carbon;

class IndexController extends Controller
{
    /**
     * Shows the admin dashboard.
     *
     * @param Modules $modules
     */
    public function get(Modules $modules)
    {
        // Count in the database because loading all users can exhaust the memory.
        $now = Carbon::now();
        $userCounts = User::toBase()
            ->selectRaw('count(*) as all_users')
            ->selectRaw('count(login_at) as login_users')
            ->selectRaw('count(*) filter (where login_at > ?) as last_month', [$now->copy()->subMonth()])
            ->selectRaw('count(*) filter (where login_at > ?) as last_week', [$now->copy()->subWeek()])
            ->selectRaw('count(*) filter (where login_at > ?) as last_day', [$now->copy()->subDay()])
            ->first();

        $allUsers = $userCounts->all_users;
        $loginUsers = $userCounts->login_users;
        $activeUsersLastMonth = $userCounts->last_month;
        $activeUsersLastWeek = $userCounts->last_week;
        $activeUsersLastDay = $userCounts->last_day;

        $installedModules = $modules->getInstalledModules();

        $days = collect([7, 6, 5, 4, 3, 2, 1, 0])
            ->map(fn ($item) => Carbon::today()->subDays($item));

        $imageData = ImageAnnotation::selectRaw('created_at::date as day, count(id)')
            ->where('created_at', '>=', Carbon::today()->subWeek())
            ->groupBy('day')
            ->pluck('count', 'day');

        $imageAnnotationWeek = $days->map(fn ($day) => $imageData->get($day->toDateString(), 0));
        $totalAnnotations = number_format(ImageAnnotation::estimatedCount());

        $videoData = VideoAnnotation::selectRaw('created_at::date as day, count(id)')
            ->where('created_at', '>=', Carbon::today()->subWeek())
            ->groupBy('day')
            ->pluck('count', 'day');

        $videoAnnotationWeek = $days->map(fn ($day) => $videoData->get($day->toDateString(), 0));
        $totalVideoAnnotations = number_format(VideoAnnotation::estimatedCount());

        $dayNames = $days->map(fn ($day) => $day->format('D'));

        return view('admin.index', compact(
            'activeUsersLastDay',
            'activeUsersLastMonth',
            'activeUsersLastWeek',
            'allUsers',
            'dayNames',
            'imageAnnotationWeek',
            'installedModules',
            'loginUsers',
            'totalAnnotations',
            'totalVideoAnnotations',
            'videoAnnotationWeek',
        ));
    }
}
