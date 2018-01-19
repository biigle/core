<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers\Mixins\Views;

use Biigle\User;
use Biigle\LabelTree;
use Biigle\Visibility;

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
        if ($user->isAdmin) {
            $queryBuilder = LabelTree::query();
        } else {
            $queryBuilder = LabelTree::where(function ($query) use ($user) {
                    $query->where('label_trees.visibility_id', Visibility::$public->id)
                        // Do it like this instead of a join with label_tree_user because
                        // there can be global label trees without any members, too!
                        ->orWhere(function ($query) use ($user) {
                            $query->whereIn('id', function ($query) use ($user) {
                                $query->select('label_tree_id')
                                    ->from('label_tree_user')
                                    ->where('user_id', $user->id);
                            });
                        })
                        // If the user is member of a project where the label tree is
                        // used, they may access it as well, even if they are no member
                        // of the label tree.
                        ->orWhere(function ($query) use ($user) {
                            $query->whereIn('id', function ($query) use ($user) {
                                $query->select('label_tree_project.label_tree_id')
                                    ->from('label_tree_project')
                                    ->join('project_user', 'project_user.project_id', '=', 'label_tree_project.project_id')
                                    ->where('project_user.user_id', $user->id);
                            });
                        });
                })
                ->select('label_trees.*');
        }

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
            $values['results'] = $queryBuilder->orderBy('label_trees.updated_at', 'desc')
                ->paginate(10);

            $values['labelTreeResultCount'] = $values['results']->total();
        } else {
            $values = ['labelTreeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
