<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\User;
use Biigle\LabelTree;
use Biigle\Services\Modules;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class SearchController extends Controller
{
    /**
     * Shows the search page.
     *
     * @param Guard $auth
     * @param Request $request
     * @param Modules $modules
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, Request $request, Modules $modules)
    {
        $query = $request->input('q', '');
        // Type (e.g. projects, volumes)
        $type = $request->input('t', '');
        $user = $auth->user();

        $args = compact('user', 'query', 'type');
        $values = $this->searchLabelTrees($user, $query, $type);
        $values = array_merge($values, $modules->callControllerMixins('search', $args));

        if (array_key_exists('results', $values)) {
            if ($query) {
                $values['results']->appends('q', $query);
            }

            if ($type) {
                $values['results']->appends('t', $type);
            }
        }

        return view('search.index', array_merge($args, $values));
    }

    /**
     * Add label tree results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchLabelTrees(User $user, $query, $type)
    {
        $queryBuilder = LabelTree::withoutVersions()->accessibleBy($user);

        if ($query) {
            $queryBuilder = $queryBuilder->where(function ($q) use ($query) {
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
