<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\Image;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\View;

class DashboardController extends Controller
{
    /**
     * Number of annotation labels that are inspected to find recently annotated files.
     *
     * @var int
     */
    const ACTIVITY_SCAN_LIMIT = 500;

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
            // Load the volumes that are shown as preview for each project here so the
            // dashboard view does not have to run a query for each project. Volumes
            // that were created in the same second are ordered by ID so the preview
            // does not change between requests.
            ->with(['volumes' => fn ($query) => $query
                ->orderBy('volumes.created_at', 'desc')
                ->orderBy('volumes.id', 'desc')
                ->limit(4),
            ])
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
            ->map(fn ($item) => [
                'item' => $item,
                'created_at' => $item->created_at,
                'include' => 'volumes.dashboardActivityItem',
            ])
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
        $timestamps = $this->recentlyAnnotatedFiles(
            'image_annotation_labels',
            'image_annotations',
            'image_id',
            $user,
            $limit,
            $newerThan
        );

        return $this->buildActivityItems(
            Image::class,
            $timestamps,
            'annotations.dashboardActivityItem'
        );
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
        $timestamps = $this->recentlyAnnotatedFiles(
            'video_annotation_labels',
            'video_annotations',
            'video_id',
            $user,
            $limit,
            $newerThan
        );

        return $this->buildActivityItems(
            Video::class,
            $timestamps,
            'videos.dashboardActivityItem'
        );
    }

    /**
     * Get the files that a user annotated most recently.
     *
     * Aggregating all annotation labels of a user is prohibitively expensive for users
     * with many annotations. Instead, only the most recent ACTIVITY_SCAN_LIMIT
     * annotation labels are inspected, which is cheap with the user_id/created_at
     * index. A user who spread fewer than $limit files over more annotation labels than
     * that may see fewer activity items.
     *
     * @param string $labelTable
     * @param string $annotationTable
     * @param string $fileKey Name of the file ID column of the annotation table.
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array Map of file ID to the timestamp of the most recent annotation label.
     */
    protected function recentlyAnnotatedFiles($labelTable, $annotationTable, $fileKey, User $user, $limit, $newerThan = null)
    {
        $recentLabels = DB::table($labelTable)
            ->select('annotation_id', 'created_at')
            ->where('user_id', $user->id)
            ->when(!is_null($newerThan), function ($query) use ($newerThan) {
                $query->where('created_at', '>', $newerThan);
            })
            ->orderBy('created_at', 'desc')
            ->limit(self::ACTIVITY_SCAN_LIMIT);

        // Reduce the annotation labels to files in the database so only $limit rows are
        // returned no matter how many annotation labels were scanned.
        return DB::query()
            ->fromSub($recentLabels, 'recent_labels')
            ->join($annotationTable, "{$annotationTable}.id", '=', 'recent_labels.annotation_id')
            ->selectRaw("{$annotationTable}.{$fileKey} as file_id, max(recent_labels.created_at) as max_created_at")
            ->groupBy("{$annotationTable}.{$fileKey}")
            ->orderBy('max_created_at', 'desc')
            ->limit($limit)
            ->pluck('max_created_at', 'file_id')
            ->all();
    }

    /**
     * Assemble the dashboard activity items for the given files.
     *
     * @param string $model Class name of the file model.
     * @param array $timestamps Map of file ID to timestamp, ordered most recent first.
     * @param string $include Name of the view to render the item with.
     *
     * @return array
     */
    protected function buildActivityItems($model, array $timestamps, $include)
    {
        if (empty($timestamps)) {
            return [];
        }

        $files = $model::whereIn('id', array_keys($timestamps))->get()->keyBy('id');

        return collect($timestamps)
            ->filter(fn ($createdAt, $id) => $files->has($id))
            ->map(fn ($createdAt, $id) => [
                'item' => $files[$id],
                'created_at' => (string) $createdAt,
                'include' => $include,
            ])
            ->values()
            ->all();
    }

    /**
     * Show the landing page if no user is authenticated.
     */
    protected function indexLandingPage()
    {
        /** @phpstan-ignore argument.type */
        return view('landing');
    }
}
