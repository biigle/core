<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\LabelTree;

class SearchControllerMixin
{
    /**
     * Add label tree results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function index(User $user, $query, $type)
    {
        $queryBuilder = LabelTree::withoutVersions()->accessibleBy($user);

        if ($query) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $queryBuilder = $queryBuilder->where(function ($q) use ($query, $operator) {
                $q->where('label_trees.name', $operator, "%{$query}%")
                    ->orWhere('label_trees.description', $operator, "%{$query}%");
            });
        }

        $values = [];

        if ($type === 'label-trees') {
            $values['results'] = $queryBuilder
                ->orderBy('label_trees.updated_at', 'desc')
                ->paginate(10);

            $values['labelTreeResultCount'] = $values['results']->total();
        } else {
            $values = ['labelTreeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
