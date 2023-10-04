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
     * @return \Illuminate\Http\Response
     */
    public function get(Modules $modules)
    {
        $users = User::select('login_at')->get();
        $allUsers = $users->count();
        $loginUsers = $users->where('login_at', '!=', null)->count();
        $activeUsersLastMonth = $users->where('login_at', '>', Carbon::now()->subMonth())->count();
        $activeUsersLastWeek = $users->where('login_at', '>', Carbon::now()->subWeek())->count();
        $activeUsersLastDay = $users->where('login_at', '>', Carbon::now()->subDay())->count();

        $installedModules = $modules->getInstalledModules();

        $days = collect([7, 6, 5, 4, 3, 2, 1, 0])
            ->map(fn($item) => Carbon::today()->subDays($item));

        $imageData = ImageAnnotation::selectRaw('created_at::date as day, count(id)')
            ->where('created_at', '>=', Carbon::today()->subWeek())
            ->groupBy('day')
            ->pluck('count', 'day');

        $imageAnnotationWeek = $days->map(function ($day) use ($imageData) {
            return $imageData->get($day->toDateString(), 0);
        });
        $totalAnnotations = number_format(ImageAnnotation::count());

        $videoData = VideoAnnotation::selectRaw('created_at::date as day, count(id)')
            ->where('created_at', '>=', Carbon::today()->subWeek())
            ->groupBy('day')
            ->pluck('count', 'day');

        $videoAnnotationWeek = $days->map(function ($day) use ($videoData) {
            return $videoData->get($day->toDateString(), 0);
        });
        $totalVideoAnnotations = number_format(VideoAnnotation::count());

        $dayNames = $days->map(fn($day) => $day->format('D'));

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
