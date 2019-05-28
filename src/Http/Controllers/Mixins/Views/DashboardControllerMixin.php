<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\Volume;

class DashboardControllerMixin
{
    /**
     * Get the most recently created volume a user.
     *
     * @param User $user
     * @param int $limit
     *
     * @return array
     */
    public function activityItems(User $user, $limit = 3, $newerThan = null)
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
                    'include' => 'volumes::dashboardActivityItem',
                ];
            })
            ->all();
    }
}
