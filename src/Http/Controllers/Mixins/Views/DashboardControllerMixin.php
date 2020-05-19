<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\Image;

class DashboardControllerMixin
{
    /**
     * Get the most recently annotated images of a user.
     *
     * @param User $user
     * @param int $limit
     * @param string $newerThan
     *
     * @return array
     */
    public function activityItems(User $user, $limit = 3, $newerThan = null)
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
                    'include' => 'annotations::dashboardActivityItem',
                ];
            })
            ->all();
    }
}
