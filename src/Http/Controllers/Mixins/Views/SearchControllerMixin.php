<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\Volume;

class SearchControllerMixin
{
    /**
     * Add volume results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function index(User $user, $query, $type)
    {
        if ($user->isAdmin) {
            $queryBuilder = Volume::query();
        } else {
            $queryBuilder = Volume::join('project_volume', 'volumes.id', '=', 'project_volume.volume_id')
                ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                // Use distinct as volumes may be attached to more than one project.
                ->distinct()
                ->select('volumes.id', 'volumes.updated_at', 'volumes.name');
        }


        if ($query) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $queryBuilder = $queryBuilder->where('volumes.name', $operator, "%{$query}%");
        }

        $values = [];

        if ($type === 'volumes') {
            $values['results'] = $queryBuilder->orderBy('volumes.updated_at', 'desc')
                ->paginate(12);

            $values['volumeResultCount'] = $values['results']->total();
        } else {
            $values = ['volumeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
