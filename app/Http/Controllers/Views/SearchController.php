<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\FederatedSearchModel;
use Biigle\Image;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Services\Modules;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

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
        $hasFederatedSearch = $user->FederatedSearchModels()->exists();
        $includeFederatedSearch = $hasFederatedSearch && $user->getSettings('include_federated_search', true);

        $args = compact('user', 'query', 'type', 'hasFederatedSearch', 'includeFederatedSearch');
        $values = $this->searchProjects($user, $query, $type, $includeFederatedSearch);
        $values = array_merge($values, $this->searchLabelTrees($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchVolumes($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchAnnotations($user, $query, $type));
        $values = array_merge($values, $this->searchVideos($user, $query, $type));
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
     * @param bool $includeFederatedSearch
     *
     * @return array
     */
    protected function searchLabelTrees(User $user, $query, $type, $includeFederatedSearch)
    {
        $queryBuilder = LabelTree::withoutVersions()->accessibleBy($user);

        $queryBuilder
            ->selectRaw("id, name, description, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            $queryBuilder2 = $user
                ->federatedSearchModels()
                ->labelTrees()
                ->selectRaw("id, name, description, updated_at, true as external")
                ->when($query, function ($q) use ($query) {
                    // The where must be added separately to the second select statement
                    // of the union. See: https://github.com/laravel/framework/pull/34813
                    $q->where(function ($q) use ($query) {
                        $q->where('name', 'ilike', "%{$query}%")
                            ->orWhere('description', 'ilike', "%{$query}%");
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $values = [];

        if ($type === 'label-trees') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(10);

            $collection = $results->getCollection();
            $internal = LabelTree::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            $results->setCollection($collection->map(function ($item) use ($internal, $external) {
                if ($item->external) {
                    return $external[$item->id];
                }

                return $internal[$item->id];
            }));

            $values['results'] = $results;

            $values['labelTreeResultCount'] = $values['results']->total();
        } else {
            $values = ['labelTreeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add project results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     * @param bool $includeFederatedSearch
     *
     * @return array
     */
    protected function searchProjects(User $user, $query, $type, $includeFederatedSearch)
    {
        if ($user->can('sudo')) {
            $queryBuilder = Project::query();
        } else {
            $queryBuilder = Project::accessibleBy($user);
        }

        $queryBuilder
            ->selectRaw("id, name, description, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            $queryBuilder2 = $user
                ->federatedSearchModels()
                ->projects()
                ->selectRaw("id, name, description, updated_at, true as external")
                ->when($query, function ($q) use ($query) {
                    // The where must be added separately to the second select statement
                    // of the union. See: https://github.com/laravel/framework/pull/34813
                    $q->where(function ($q) use ($query) {
                        $q->where('name', 'ilike', "%{$query}%")
                            ->orWhere('description', 'ilike', "%{$query}%");
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $values = [];

        if (!$type || $type === 'projects') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(10);

            $collection = $results->getCollection();
            $internal = Project::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            $results->setCollection($collection->map(function ($item) use ($internal, $external) {
                if ($item->external) {
                    return $external[$item->id];
                }

                return $internal[$item->id];
            }));

            $values['results'] = $results;

            $values['projectResultCount'] = $values['results']->total();
        } else {
            $values = ['projectResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add volume results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     * @param bool $includeFederatedSearch
     *
     * @return array
     */
    protected function searchVolumes(User $user, $query, $type, $includeFederatedSearch)
    {
        $queryBuilder = Volume::accessibleBy($user);

        $queryBuilder
            ->selectRaw("id, name, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            $queryBuilder2 = $user
                ->federatedSearchModels()
                ->volumes()
                ->selectRaw("id, name, updated_at, true as external")
                ->when($query, function ($q) use ($query) {
                    // The where must be added separately to the second select statement
                    // of the union. See: https://github.com/laravel/framework/pull/34813
                    $q->where(function ($q) use ($query) {
                        $q->where('name', 'ilike', "%{$query}%");
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $values = [];

        if ($type === 'volumes') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(12);

            $collection = $results->getCollection();
            $internal = Volume::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            $results->setCollection($collection->map(function ($item) use ($internal, $external) {
                if ($item->external) {
                    return $external[$item->id];
                }

                return $internal[$item->id];
            }));

            $values['results'] = $results;

            $values['volumeResultCount'] = $values['results']->total();
        } else {
            $values = ['volumeResultCount' => $queryBuilder->count()];
        }

        return $values;
    }

    /**
     * Add image results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchAnnotations(User $user, $query, $type)
    {
        if ($user->can('sudo')) {
            $imageQuery = Image::query();
        } else {
            $imageQuery = Image::join('project_volume', 'images.volume_id', '=', 'project_volume.volume_id')
                ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                // Use distinct as volumes may be attached to more than one project.
                ->distinct();
        }

        $imageQuery = $imageQuery
            ->select('images.id', 'images.filename', 'images.uuid', 'images.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('images.filename', 'ilike', "%{$query}%");
                });
            });

        $values = [
            'imageResultCount' => $imageQuery->count('images.id'),
        ];

        if ($type === 'images') {
            $values['results'] = $imageQuery
                ->orderBy('images.id', 'desc')
                ->paginate(12);
        }

        return $values;
    }

    /**
     * Add video results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    protected function searchVideos(User $user, $query, $type)
    {
        if ($user->can('sudo')) {
            $queryBuilder = Video::query();
        } else {
            $queryBuilder = Video::join('project_volume', 'videos.volume_id', '=', 'project_volume.volume_id')
                ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                ->where('project_user.user_id', $user->id)
                // Use distinct as volumes may be attached to more than one project.
                ->distinct();
        }

        $queryBuilder = $queryBuilder
            ->select('videos.id', 'videos.filename', 'videos.uuid', 'videos.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('videos.filename', 'ilike', "%{$query}%");
                });
            });

        $values = [];

        if ($type === 'videos') {
            $values['results'] = $queryBuilder
                ->orderBy('videos.id', 'desc')
                ->paginate(12);

            $values['videoResultCount'] = $values['results']->total();
        } else {
            $values = ['videoResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
