<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\Image;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;
use Carbon\Carbon;
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
     */
    public function index(Guard $auth)
    {
        if ($auth->check()) {
            return $this->indexDashboard($auth->user());
        }

        return $this->indexLandingPage();
    }

    /**
     * Show the dashboard for a logged in user.
     *
     * @param User $user
     */
    protected function indexDashboard(User $user)
    {
        $newerThan = Carbon::now()->subDays(7);
        $limit = 4;
        $volumes = $this->volumesActivityItems($user, $limit, $newerThan);
        $annotations = $this->annotationsActivityItems($user, $limit, $newerThan);
        $videos = $this->videosActivityItems($user, $limit, $newerThan);
        $items = collect(array_merge($volumes, $annotations, $videos))
            ->sortByDesc('created_at')
            ->take($limit);

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
        return Image::join('image_annotations', 'images.id', '=', 'image_annotations.image_id')
            ->join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->where('image_annotation_labels.user_id', $user->id)
            ->when(!is_null($newerThan), function ($query) use ($newerThan) {
                $query->where('image_annotation_labels.created_at', '>', $newerThan);
            })
            ->selectRaw('images.*, max(image_annotation_labels.created_at) as annotation_labels_created_at')
            ->groupBy('images.id')
            ->orderBy('annotation_labels_created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'item' => $item,
                    /** @phpstan-ignore property.notFound */
                    'created_at' => $item->annotation_labels_created_at,
                    'include' => 'annotations.dashboardActivityItem',
                ];
            })
            ->all();
    }

    /**
     * Get the most recently annotated videos of a user.
     *
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array
     */
    public function videosActivityItems(User $user, $limit = 3, $newerThan = null)
    {
        return Video::join('video_annotations', 'videos.id', '=', 'video_annotations.video_id')
            ->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->where('video_annotation_labels.user_id', $user->id)
            ->when(!is_null($newerThan), function ($query) use ($newerThan) {
                $query->where('video_annotation_labels.created_at', '>', $newerThan);
            })
            ->selectRaw('videos.*, max(video_annotation_labels.created_at) as video_annotation_labels_created_at')
            ->groupBy('videos.id')
            ->orderBy('video_annotation_labels_created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'item' => $item,
                    /** @phpstan-ignore property.notFound */
                    'created_at' => $item->video_annotation_labels_created_at,
                    'include' => 'videos.dashboardActivityItem',
                ];
            })
            ->all();
    }

    /**
     * Show the landing page if no user is authenticated.
     */
    protected function indexLandingPage()
    {
        return view('landing');
    }
}
