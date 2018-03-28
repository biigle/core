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
        $queryBuilder = Volume::accessibleBy($user)
            ->select('volumes.id', 'volumes.updated_at', 'volumes.name');

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
