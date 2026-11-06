<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\ExportFile;
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
     * Upper bound for the result counts of the project, label tree, volume and
     * file tabs.
     *
     * Determining the exact number of matches means scanning every matching
     * row. The number is only shown as a tab badge and in the result heading,
     * and nobody pages through more results than this, so counting stops once
     * more than this many matches are known to exist.
     *
     * @var int
     */
    const MAX_RESULT_COUNT = 1000;

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

        $resultCountCap = self::MAX_RESULT_COUNT;
        $minFileQueryLength = self::MIN_FILE_QUERY_LENGTH;
        $fileQueryTooShort = $this->fileQueryTooShort($query);

        $args = compact('user', 'query', 'type', 'hasFederatedSearch', 'includeFederatedSearch', 'resultCountCap', 'minFileQueryLength', 'fileQueryTooShort');
        $values = $this->searchProjects($user, $query, $type, $includeFederatedSearch);
        $values = array_merge($values, $this->searchLabelTrees($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchVolumes($user, $query, $type, $includeFederatedSearch));
        $values = array_merge($values, $this->searchAnnotations($user, $query, $type));
        $values = array_merge($values, $this->searchVideos($user, $query, $type));
        $values = array_merge($values, $this->searchReports($user, $query, $type));
        if ($user->can('sudo')) {
            $values = array_merge($values, $this->searchExports($user, $query, $type));
        }
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
                    $q->where('name', 'ilike', $this->likePattern($query))
                        ->orWhere('description', 'ilike', $this->likePattern($query));
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
                        $q->where('name', 'ilike', $this->likePattern($query))
                            ->orWhere('description', 'ilike', $this->likePattern($query));
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $count = $this->cappedResultCount($queryBuilder);
        $values = [
            'labelTreeResultCount' => min($count, self::MAX_RESULT_COUNT),
            'labelTreeResultCountCapped' => $count > self::MAX_RESULT_COUNT,
        ];

        if ($type === 'label-trees') {
            $results = $this->paginateCapped($queryBuilder->orderBy('updated_at', 'desc'), $count, 10);

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
                    $q->where('name', 'ilike', $this->likePattern($query))
                        ->orWhere('description', 'ilike', $this->likePattern($query));
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
                        $q->where('name', 'ilike', $this->likePattern($query))
                            ->orWhere('description', 'ilike', $this->likePattern($query));
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $count = $this->cappedResultCount($queryBuilder);
        $values = [
            'projectResultCount' => min($count, self::MAX_RESULT_COUNT),
            'projectResultCountCapped' => $count > self::MAX_RESULT_COUNT,
        ];

        if (!$type || $type === 'projects') {
            $results = $this->paginateCapped($queryBuilder->orderBy('updated_at', 'desc'), $count, 10);

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
                    $q->where('name', 'ilike', $this->likePattern($query));
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
                        $q->where('name', 'ilike', $this->likePattern($query));
                    });
                });

            $queryBuilder = $queryBuilder->union($queryBuilder2);
        }


        $count = $this->cappedResultCount($queryBuilder);
        $values = [
            'volumeResultCount' => min($count, self::MAX_RESULT_COUNT),
            'volumeResultCountCapped' => $count > self::MAX_RESULT_COUNT,
        ];

        if ($type === 'volumes') {
            $results = $this->paginateCapped($queryBuilder->orderBy('updated_at', 'desc'), $count, 12);

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
        }

        return $values;
    }

    /**
     * Turn a search term into a pattern for a substring match with (i)like.
     *
     * Wildcards in the term are escaped, so they are matched literally. Else
     * a term like "%%%" would get past the minimum length and match everything.
     *
     * @param string $query
     *
     * @return string
     */
    protected function likePattern($query)
    {
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query);

        return "%{$escaped}%";
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
     * Count the results of a query, up to one more than MAX_RESULT_COUNT.
     *
     * The selected columns are kept, because all parts of a union (with federated
     * search models) must select the same columns.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     *
     * @return int
     */
    protected function cappedResultCount($queryBuilder)
    {
        $limited = $queryBuilder->clone()->limit(self::MAX_RESULT_COUNT + 1);

        return DB::query()->fromSub($limited, 'capped')->count();
    }

    /**
     * Paginate a query with a total that is capped at MAX_RESULT_COUNT.
     *
     * This bounds the number of pages as well. Later pages resolve to the last
     * page, because the paginator would otherwise run the arbitrarily large offset
     * of a hand-written URL.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param int $count Result of cappedResultCount()
     * @param int $perPage
     *
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    protected function paginateCapped($queryBuilder, $count, $perPage)
    {
        $total = min($count, self::MAX_RESULT_COUNT);
        $lastPage = max((int) ceil($total / $perPage), 1);
        $page = min(Paginator::resolveCurrentPage(), $lastPage);

        return $queryBuilder->paginate($perPage, page: $page, total: $total);
    }

    /**
     * Paginate a file query, ordered by descending ID.
     *
     * A filename filter cannot use an index, so the query planner is free to
     * assume that walking the primary key backwards will fill the page quickly.
     * For users whose files have low IDs that assumption is wrong and the whole
     * table gets scanned (observed: 74 s for one page of 12). For restricted
     * users, "id + 0" prevents the primary key scan, so the matches are
     * collected through the volume_id index and sorted afterwards.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param int $count Result of cappedResultCount()
     * @param int $perPage
     * @param bool $restricted Whether the query is restricted to some volumes
     *
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    protected function paginateFiles($queryBuilder, $count, $perPage, $restricted)
    {
        if ($restricted) {
            $queryBuilder->orderByRaw('id + 0 desc');
        } else {
            $queryBuilder->orderBy('id', 'desc');
        }

        return $this->paginateCapped($queryBuilder, $count, $perPage);
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
                $values['results'] = Image::query()->paginate(12, total: 0);
            }

            return $values;
        }

        $restricted = !$user->can('sudo');

        if ($restricted) {
            $imageQuery = Image::whereIn('volume_id', Volume::accessibleBy($user)->select('id'));
        } else {
            $imageQuery = Image::query();
        }

        $imageQuery = $imageQuery->select('images.id', 'images.filename', 'images.uuid', 'images.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('images.filename', 'ilike', $this->likePattern($query));
                });
            });

        $count = $this->cappedResultCount($imageQuery);
        $values['imageResultCount'] = min($count, self::MAX_RESULT_COUNT);
        $values['imageResultCountCapped'] = $count > self::MAX_RESULT_COUNT;

        if ($type === 'images') {
            $values['results'] = $this->paginateFiles($imageQuery, $count, 12, $restricted);
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
        $values = [];

        if ($this->fileQueryTooShort($query)) {
            $values['videoResultCount'] = 0;
            $values['videoResultCountCapped'] = false;

            if ($type === 'videos') {
                $values['results'] = Video::query()->paginate(12, total: 0);
            }

            return $values;
        }

        $restricted = !$user->can('sudo');

        if ($restricted) {
            $queryBuilder = Video::whereIn('volume_id', Volume::accessibleBy($user)->select('id'));
        } else {
            $queryBuilder = Video::query();
        }

        $queryBuilder = $queryBuilder->select('videos.id', 'videos.filename', 'videos.uuid', 'videos.volume_id')
            ->when($query, function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('videos.filename', 'ilike', $this->likePattern($query));
                });
            });

        $count = $this->cappedResultCount($queryBuilder);
        $values['videoResultCount'] = min($count, self::MAX_RESULT_COUNT);
        $values['videoResultCountCapped'] = $count > self::MAX_RESULT_COUNT;

        if ($type === 'videos') {
            $values['results'] = $this->paginateFiles($queryBuilder, $count, 12, $restricted);
        }

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
                                        ->where('volumes.name', 'ilike', $this->likePattern($query));
                                });
                        })
                        ->orWhere(function ($q) use ($query) {
                            $q->where('reports.source_type', Project::class)
                                ->whereExists(function ($q) use ($query) {
                                    $q->select(DB::raw(1))
                                        ->from('projects')
                                        ->whereRaw('reports.source_id = projects.id')
                                        ->where('projects.name', 'ilike', $this->likePattern($query));
                                });
                        })
                        // Kept for backwards compatibility of single video reports.
                        ->orWhere('reports.source_name', 'ilike', $this->likePattern($query));
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

    /**
     * Add requester-owned export files to the search view.
     */
    public function searchExports(User $user, $query, $type): array
    {
        $queryBuilder = ExportFile::where('user_id', $user->id)
            ->when($query, function ($q) use ($query) {
                $q->where('description', 'ilike', "%{$query}%");
            });

        if ($type === 'exports') {
            $results = $queryBuilder->orderBy('ready_at', 'desc')
                ->orderBy('id', 'desc')
                ->paginate(10);

            return [
                'results' => $results,
                'exportResultCount' => $results->total(),
            ];
        }

        return ['exportResultCount' => $queryBuilder->count()];
    }
}
