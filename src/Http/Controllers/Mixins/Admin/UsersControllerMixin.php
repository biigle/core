<?php

namespace Biigle\Modules\Videos\Http\Controllers\Mixins\Admin;

use Biigle\User;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\VideoAnnotation;
use Biigle\Modules\Videos\VideoAnnotationLabel;

class UsersControllerMixin
{
    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    public function show(User $user)
    {
        $videosTotal = Video::count();

        $videos = Video::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();

        $videosCount = $videos->count();
        $videosPercent = $videosTotal > 0 ? round($videosCount / $videosTotal * 100, 2) : 0;

        $totalDuration = Video::sum('duration');
        $duration = Video::where('creator_id', $user->id)->sum('duration');
        $durationPercent = $totalDuration > 0 ? round($duration / $totalDuration * 100, 2) : 0;

        $totalVideoAnnotationLabels = VideoAnnotationLabel::where('user_id', $user->id)->count();

        if ($totalVideoAnnotationLabels > 0) {
            $totalVideoAnnotations = VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.video_annotation_id')
                ->where('video_annotation_labels.user_id', $user->id)
                ->distinct()
                ->count('video_annotations.id');

            $relativeVideoAnnotationLabels = $totalVideoAnnotationLabels / VideoAnnotationLabel::count();
            $relativeVideoAnnotations = $totalVideoAnnotations / VideoAnnotation::count();
        } else {
            $totalVideoAnnotations = 0;
            $relativeVideoAnnotationLabels = 0;
            $relativeVideoAnnotations = 0;
        }

        return compact('videos', 'videosCount', 'videosPercent', 'duration', 'durationPercent', 'totalVideoAnnotationLabels', 'totalVideoAnnotations', 'relativeVideoAnnotationLabels', 'relativeVideoAnnotations');
    }
}
