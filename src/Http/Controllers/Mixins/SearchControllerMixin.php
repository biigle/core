<?php

namespace Biigle\Modules\Videos\Http\Controllers\Mixins;

use Biigle\User;
use Biigle\Modules\Videos\Video;

class SearchControllerMixin
{
    /**
     * Add video results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function index(User $user, $query, $type)
    {
        $queryBuilder = Video::accessibleBy($user);

        if ($query) {
            $queryBuilder = $queryBuilder->where(function ($q) use ($query) {
                $q->where('videos.name', 'ilike', "%{$query}%");
            });
        }

        $values = [];

        if ($type === 'videos') {
            $values['results'] = $queryBuilder
                ->orderBy('videos.updated_at', 'desc')
                ->paginate(10);

            $values['videoResultCount'] = $values['results']->total();
        } else {
            $values = ['videoResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
