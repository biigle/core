<?php

namespace Biigle\Modules\Projects\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\Project;

class SearchControllerMixin
{
    /**
     * Add project results to the search view.
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
            $queryBuilder = Project::query();
        } else {
            $queryBuilder = $user->projects();
        }

        if ($query) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $queryBuilder = $queryBuilder->where(function ($q) use ($query, $operator) {
                $q->where('projects.name', $operator, "%{$query}%")
                    ->orWhere('projects.description', $operator, "%{$query}%");
            });
        }

        $values = ['projectResultCount' => $queryBuilder->count()];

        if (!$type || $type === 'projects') {
            $values['results'] = $queryBuilder->orderBy('updated_at', 'desc')
                ->paginate(10);
        }

        return $values;
    }
}
