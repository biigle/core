<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\User;
use Carbon\Carbon;
use Biigle\ImageLabel;
use Biigle\AnnotationLabel;
use Biigle\Services\Modules;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Support\Facades\View;

class DashboardController extends Controller
{
    /**
     * Create a new instance.
     */
    public function __construct()
    {
        if (!View::exists('landing')) {
            $this->middleware('auth');
        }
    }

    /**
     * Show the application dashboard to the user.
     *
     * @param Guard $auth
     * @param Modules $modules
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, Modules $modules)
    {
        if ($auth->check()) {
            return $this->indexDashboard($modules, $auth->user());
        }

        return $this->indexLandingPage();
    }

    /**
     * Show the dashboard for a logged in user.
     *
     * @param Modules $modules
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function indexDashboard(Modules $modules, User $user)
    {
        $projects = $user->projects()
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get();

        $args = [
            'user' => $user,
            'newerThan' => Carbon::now()->subDays(7),
            'limit' => 3,
        ];
        $items = collect($modules->callControllerMixins('dashboardActivityItems', $args))
            ->sortByDesc('created_at')
            ->take(4);

        return view('dashboard', [
            'user' => $user,
            'projects' => $projects,
            'activityItems' => $items,
        ]);
    }

    /**
     * Show the landing page if no user is authenticated.
     *
     * @return \Illuminate\Http\Response
     */
    protected function indexLandingPage()
    {
        return view('landing');
    }
}
