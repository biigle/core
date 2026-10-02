<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\FederatedSearchModel;
use Biigle\Image;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Report;
use Biigle\Services\Modules;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;
use DB;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;

class SearchController extends Controller
{
    /**
     * Minimum length of a search term that is matched against filenames.
     *
     * A substring match cannot use an index, so every term results in a full
     * scan of the (very large) file tables. Terms this short match almost
     * everything and are not a useful query, so they are rejected instead.
     *
     * @var int
     */
    const MIN_FILE_QUERY_LENGTH = 3;

    /**
     * Upper bound for the result counts of the file tabs.
     *
     * Determining the exact number of matches means scanning every matching
     * row. The number is only shown as a tab badge and in the result heading,
     * so counting stops once this many matches are known to exist.
     *
     * @var int
     */
    const MAX_FILE_RESULT_COUNT = 1000;

    /**
     * Shows the search page.
     *
     * @param Guard $auth
     * @param Request $request
     * @param Modules $modules
     */
    public function index(Guard $auth, Request $request, Modules $modules)
    {
        // An empty "q=" in the query string arrives as null rather than as an
        // empty string, because of the ConvertEmptyStringsToNull middleware, so
        // the default of input() does not apply. Cast instead of relying on it.
        $query = (string) $request->input('q', '');
        // Type (e.g. projects, volumes)
        $type = (string) $request->input('t', '');
        $user = $auth->user();
        $hasFederatedSearch = $user->FederatedSearchModels()->exists();
        $includeFederatedSearch = $hasFederatedSearch && $user->getSettings('include_federated_search', true);

        $fileResultCountCap = self::MAX_FILE_RESULT_COUNT;
        $minFileQueryLength = self::MIN_FILE_QUERY_LENGTH;
        $fileQueryTooShort = $this->fileQueryTooShort($query);

        $args = compact('user', 'query', 'type', 'hasFederatedSearch', 'includeFederatedSearch', 'fileResultCountCap', 'minFileQueryLength', 'fileQueryTooShort');
        $values = $this->searchProjects($user, $query, $type, $includeFederatedSearch);
        $values = array_merge($values, $this->searchLabelTrees($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchVolumes($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchAnnotations($user, $query, $type));
        $values = array_merge($values, $this->searchVideos($user, $query, $type));
        $values = array_merge($values, $this->searchReports($user, $query, $type));
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

        $queryBuilder->selectRaw("id, name, description, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            /** @var \Illuminate\Database\Query\Builder $queryBuilder2 */
            $queryBuilder2 = $user->federatedSearchModels()
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
                /** @phpstan-ignore property.notFound */
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

        $queryBuilder->selectRaw("id, name, description, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%")
                        ->orWhere('description', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            /** @var \Illuminate\Database\Query\Builder $queryBuilder2 */
            $queryBuilder2 = $user->federatedSearchModels()
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
                /** @phpstan-ignore property.notFound */
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

        $queryBuilder->selectRaw("id, name, updated_at, false as external")
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'ilike', "%{$query}%");
                });
            });

        if ($includeFederatedSearch) {
            /** @var \Illuminate\Database\Query\Builder $queryBuilder2 */
            $queryBuilder2 = $user->federatedSearchModels()
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
                /** @phpstan-ignore property.notFound */
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
     * Subquery for the IDs of all volumes that are accessible by a user.
     *
     * Restricting files with this instead of joining project_volume and
     * project_user avoids the row multiplication of volumes that belong to more
     * than one project, so no DISTINCT is required over the (large) file table.
     *
     * @param User $user
     *
     * @return \Closure
     */
    protected function accessibleVolumeIds(User $user)
    {
        return fn ($query) => $query->select('project_volume.volume_id')
            ->from('project_volume')
            ->join('project_user', 'project_user.project_id', '=', 'project_volume.project_id')
            ->where('project_user.user_id', $user->id)
            ->distinct();
    }

    /**
     * Determine whether a search term is too short to be matched against
     * filenames.
     *
     * @param string $query
     *
     * @return bool
     */
    protected function fileQueryTooShort($query)
    {
        return $query !== '' && mb_strlen($query) < self::MIN_FILE_QUERY_LENGTH;
    }

    /**
     * Determine whether the result count of a file query should be capped.
     *
     * Counting every match of a search term is affordable because the term
     * narrows the result set. Counting every file a user can access is not, and
     * the exact number is of no use there anyway, so browsing without a term
     * gets a capped count instead.
     *
     * @param string $query
     *
     * @return bool
     */
    protected function shouldCapCount($query)
    {
        return $query === '';
    }

    /**
     * Determine whether a result count was limited by MAX_FILE_RESULT_COUNT.
     *
     * The count alone cannot tell: an exact count may legitimately exceed the
     * cap, and must then still be displayed as the exact number.
     *
     * @param string $query
     * @param int $count
     *
     * @return bool
     */
    protected function countWasCapped($query, $count)
    {
        return $this->shouldCapCount($query) && $count >= self::MAX_FILE_RESULT_COUNT;
    }

    /**
     * Count the results of a file query.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param string $query
     *
     * @return int
     */
    protected function fileResultCount($queryBuilder, $query)
    {
        if (!$this->shouldCapCount($query)) {
            return $queryBuilder->clone()->reorder()->count();
        }

        $limited = $queryBuilder->clone()
            ->reorder()
            ->select(DB::raw('1'))
            ->limit(self::MAX_FILE_RESULT_COUNT);

        return DB::query()->fromSub($limited, 'capped')->count();
    }

    /**
     * Fetch a single page of file results, ordered by descending ID.
     *
     * A filename filter cannot use an index, so the query planner is free to
     * assume that walking the primary key backwards will fill the page quickly.
     * For users whose files have low IDs that assumption is wrong and the whole
     * table gets scanned (observed: 74 s for one page of 12). Collecting the
     * matches in a materialized CTE takes that option away: they are gathered
     * through the volume_id index first and sorted afterwards.
     *
     * Requires PostgreSQL 12 or later for the MATERIALIZED keyword; on older
     * versions a CTE is always materialized anyway.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param int $page
     * @param int $perPage
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function fetchFilePage($queryBuilder, $page, $perPage)
    {
        $inner = $queryBuilder->clone()->reorder();

        $rows = DB::select(
            'with matches as materialized ('.$inner->toSql().')'
            .' select * from matches order by id desc limit ? offset ?',
            array_merge($inner->getBindings(), [$perPage, ($page - 1) * $perPage])
        );

        return $queryBuilder->hydrate($rows);
    }

    /**
     * Paginate a file query.
     *
     * When the count is capped the number of pages is bounded by
     * MAX_FILE_RESULT_COUNT as well, so that no page can be requested whose
     * position is beyond what was counted.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param string $query
     * @param int $perPage
     *
     * @return LengthAwarePaginator
     */
    protected function paginateFiles($queryBuilder, $query, $perPage)
    {
        $total = $this->fileResultCount($queryBuilder, $query);
        $page = Paginator::resolveCurrentPage();

        $items = $total > 0
            ? $this->fetchFilePage($queryBuilder, $page, $perPage)
            : collect();

        return new LengthAwarePaginator($items, $total, $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'pageName' => 'page',
        ]);
    }

    /**
     * An empty paginator, used when a search term is rejected outright.
     *
     * @param int $perPage
     *
     * @return LengthAwarePaginator
     */
    protected function emptyPaginator($perPage)
    {
        return new LengthAwarePaginator(collect(), 0, $perPage, 1, [
            'path' => Paginator::resolveCurrentPath(),
            'pageName' => 'page',
        ]);
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
        $values = [];

        if ($this->fileQueryTooShort($query)) {
            $values['imageResultCount'] = 0;
            $values['imageResultCountCapped'] = false;

            if ($type === 'images') {
                $values['results'] = $this->emptyPaginator(12);
            }

            return $values;
        }

        if ($user->can('sudo')) {
            $imageQuery = Image::query();
        } else {
            $imageQuery = Image::whereIn('volume_id', $this->accessibleVolumeIds($user));
        }

        $imageQuery = $imageQuery->select('images.id', 'images.filename', 'images.uuid', 'images.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('images.filename', 'ilike', "%{$query}%");
                });
            });

        if ($type === 'images') {
            // The ordering is applied by paginateFiles().
            $values['results'] = $this->paginateFiles($imageQuery, $query, 12);

            $values['imageResultCount'] = $values['results']->total();
        } else {
            $values['imageResultCount'] = $this->fileResultCount($imageQuery, $query);
        }

        $values['imageResultCountCapped'] = $this->countWasCapped($query, $values['imageResultCount']);

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
        $values = [];

        if ($this->fileQueryTooShort($query)) {
            $values['videoResultCount'] = 0;
            $values['videoResultCountCapped'] = false;

            if ($type === 'videos') {
                $values['results'] = $this->emptyPaginator(12);
            }

            return $values;
        }

        if ($user->can('sudo')) {
            $queryBuilder = Video::query();
        } else {
            $queryBuilder = Video::whereIn('volume_id', $this->accessibleVolumeIds($user));
        }

        $queryBuilder = $queryBuilder->select('videos.id', 'videos.filename', 'videos.uuid', 'videos.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('videos.filename', 'ilike', "%{$query}%");
                });
            });

        if ($type === 'videos') {
            // The ordering is applied by paginateFiles().
            $values['results'] = $this->paginateFiles($queryBuilder, $query, 12);

            $values['videoResultCount'] = $values['results']->total();
        } else {
            $values['videoResultCount'] = $this->fileResultCount($queryBuilder, $query);
        }

        $values['videoResultCountCapped'] = $this->countWasCapped($query, $values['videoResultCount']);

        return $values;
    }

    /**
     * Add report results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function searchReports(User $user, $query, $type)
    {
        $queryBuilder = Report::where('reports.user_id', '=', $user->id);

        if ($query) {
            $queryBuilder = $queryBuilder
                ->where(function ($q) use ($query) {
                    $q
                        ->where(function ($q) use ($query) {
                            $q->where('reports.source_type', Volume::class)
                                ->whereExists(function ($q) use ($query) {
                                    $q->select(DB::raw(1))
                                        ->from('volumes')
                                        ->whereRaw('reports.source_id = volumes.id')
                                        ->where('volumes.name', 'ilike', "%{$query}%");
                                });
                        })
                        ->orWhere(function ($q) use ($query) {
                            $q->where('reports.source_type', Project::class)
                                ->whereExists(function ($q) use ($query) {
                                    $q->select(DB::raw(1))
                                        ->from('projects')
                                        ->whereRaw('reports.source_id = projects.id')
                                        ->where('projects.name', 'ilike', "%{$query}%");
                                });
                        })
                        // Kept for backwards compatibility of single video reports.
                        ->orWhere('reports.source_name', 'ilike', "%{$query}%");
                });
        }

        $values = [];

        if ($type === 'reports') {
            $values['results'] = $queryBuilder->orderBy('reports.ready_at', 'desc')
                ->with('source')
                ->paginate(10);

            $values['reportResultCount'] = $values['results']->total();
        } else {
            $values = ['reportResultCount' => $queryBuilder->count()];
        }

        return $values;
    }
}
