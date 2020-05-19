<?php

namespace Biigle\Modules\Videos\Http\Controllers\Mixins;

use Biigle\User;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\VideoAnnotationLabel;

class DashboardControllerMixin
{
    /**
     * Get the most recently annotated and/or created videos of a user.
     *
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array
     */
    public function activityItems(User $user, $limit = 3, $newerThan = null)
    {
        $annotated = Video::join('video_annotations', 'videos.id', '=', 'video_annotations.video_id')
            ->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.video_annotation_id')
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
                    'created_at' => $item->video_annotation_labels_created_at,
                    'include' => 'videos::dashboardActivityItem',
                ];
            });

        $created = Video::where('creator_id', $user->id)
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
                    'include' => 'videos::dashboardActivityItem',
                ];
            });

        return $annotated->concat($created)->all();
    }
}
