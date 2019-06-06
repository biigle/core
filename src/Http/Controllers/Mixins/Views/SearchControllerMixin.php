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
            $queryBuilder = $queryBuilder->where(function ($q) use ($query, $operator) {
                $q->where('label_trees.name', 'ilike', "%{$query}%")
                    ->orWhere('label_trees.description', 'ilike', "%{$query}%");
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
