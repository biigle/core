<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\User;
use Carbon\Carbon;
use Biigle\Annotation;
use Biigle\Services\Modules;
use Biigle\Http\Controllers\Controller;

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

        $days = Annotation::selectRaw('cast(created_at as date) as day, count(id)')
            ->where('created_at', '>=', Carbon::today()->subWeek())
            ->groupBy('day')
            ->pluck('count', 'day');
        $max = $days->max() ?: 0;
        $annotationWeek = collect([7, 6, 5, 4, 3, 2, 1, 0])
            ->map(function ($item) use ($days, $max) {
                $day = Carbon::today()->subDays($item);
                $count = $days->get($day->toDateString(), 0);

                return [
                    'day' => $day,
                    'count' => $count,
                    'percent' => ($max !== 0) ? $count / $max : 0,
                ];
            });
        $totalAnnotations = number_format(Annotation::count());

        return view('admin.index', compact(
            'allUsers',
            'loginUsers',
            'activeUsersLastMonth',
            'activeUsersLastWeek',
            'activeUsersLastDay',
            'installedModules',
            'annotationWeek',
            'totalAnnotations'
        ));
    }
}
