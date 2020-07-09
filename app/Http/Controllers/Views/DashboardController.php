<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\User;
use Biigle\Image;
use Biigle\Volume;
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
        $args = [
            'user' => $user,
            'newerThan' => Carbon::now()->subDays(7),
            'limit' => 3,
        ];
        // TODO remove use of $modules once biigle/volumes, biigle/annotations and
        // biigle/videos have been merged into biigle/core.
        $items = $this->volumesActivityItems($user, $args['limit'], $args['newerThan']);
        $items = array_merge($items, $this->annotationsActivityItems($user, $args['limit'], $args['newerThan']));
        $items = array_merge($items, $modules->callControllerMixins('dashboardActivityItems', $args));
        $items = collect($items)->sortByDesc('created_at')->take(4);

        $projects = $user->projects()
            ->orderBy('pivot_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take($items->isEmpty() ? 4 : 3)
            ->get();

        return view('dashboard', [
            'user' => $user,
            'projects' => $projects,
            'activityItems' => $items,
        ]);
    }

    /**
     * Get the most recently created volume a user.
     *
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array
     */
    public function volumesActivityItems(User $user, $limit = 3, $newerThan = null)
    {
        return Volume::where('creator_id', $user->id)
            ->when(!is_null($newerThan), function ($query) use ($newerThan) {
                $query->where('created_at', '>', $newerThan);
            })
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'item' => $item,
                    'created_at' => $item->created_at,
                    'include' => 'volumes.dashboardActivityItem',
                ];
            })
            ->all();
    }

    /**
     * Get the most recently annotated images of a user.
     *
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array
     */
    public function annotationsActivityItems(User $user, $limit = 3, $newerThan = null)
    {
        return Image::join('annotations', 'images.id', '=', 'annotations.image_id')
            ->join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->where('annotation_labels.user_id', $user->id)
            ->when(!is_null($newerThan), function ($query) use ($newerThan) {
                $query->where('annotation_labels.created_at', '>', $newerThan);
            })
            ->selectRaw('images.*, max(annotation_labels.created_at) as annotation_labels_created_at')
            ->groupBy('images.id')
            ->orderBy('annotation_labels_created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'item' => $item,
                    'created_at' => $item->annotation_labels_created_at,
                    'include' => 'annotations.dashboardActivityItem',
                ];
            })
            ->all();
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
