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
     * and nobody pages through more results than this, so counting stops once
     * more than this many matches are known to exist.
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


        $values = [];

        if ($type === 'label-trees') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(10);

            $collection = $results->getCollection();
            $internal = LabelTree::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            /** @phpstan-ignore argument.type */
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


        $values = [];

        if (!$type || $type === 'projects') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(10);

            $collection = $results->getCollection();
            $internal = Project::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            /** @phpstan-ignore argument.type */
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


        $values = [];

        if ($type === 'volumes') {
            $results = $queryBuilder->orderBy('updated_at', 'desc')->paginate(12);

            $collection = $results->getCollection();
            $internal = Volume::whereIn('id', $collection->where('external', false)->pluck('id'))->get()->keyBy('id');

            $external = FederatedSearchModel::whereIn('id', $collection->where('external', true)->pluck('id'))->get()->keyBy('id');

            /** @phpstan-ignore argument.type */
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
     * Count the results of a file query, up to one more than
     * MAX_FILE_RESULT_COUNT.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     *
     * @return int
     */
    protected function cappedFileResultCount($queryBuilder)
    {
        $limited = $queryBuilder->clone()
            ->reorder()
            ->select(DB::raw('1'))
            ->limit(self::MAX_FILE_RESULT_COUNT + 1);

        return DB::query()->fromSub($limited, 'capped')->count();
    }

    /**
     * Paginate a file query, ordered by descending ID.
     *
     * The total is capped at MAX_FILE_RESULT_COUNT, which bounds the number of
     * pages as well.
     *
     * A filename filter cannot use an index, so the query planner is free to
     * assume that walking the primary key backwards will fill the page quickly.
     * For users whose files have low IDs that assumption is wrong and the whole
     * table gets scanned (observed: 74 s for one page of 12). For restricted
     * users, "id + 0" prevents the primary key scan, so the matches are
     * collected through the volume_id index and sorted afterwards.
     *
     * @param \Illuminate\Database\Eloquent\Builder $queryBuilder
     * @param int $count Result of cappedFileResultCount()
     * @param int $perPage
     * @param bool $restricted Whether the query is restricted to some volumes
     *
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    protected function paginateFiles($queryBuilder, $count, $perPage, $restricted)
    {
        $total = min($count, self::MAX_FILE_RESULT_COUNT);

        if ($restricted) {
            $queryBuilder->orderByRaw('id + 0 desc');
        } else {
            $queryBuilder->orderBy('id', 'desc');
        }

        return $queryBuilder->paginate($perPage, total: $total);
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

        $count = $this->cappedFileResultCount($imageQuery);
        $values['imageResultCount'] = min($count, self::MAX_FILE_RESULT_COUNT);
        $values['imageResultCountCapped'] = $count > self::MAX_FILE_RESULT_COUNT;

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

        $count = $this->cappedFileResultCount($queryBuilder);
        $values['videoResultCount'] = min($count, self::MAX_FILE_RESULT_COUNT);
        $values['videoResultCountCapped'] = $count > self::MAX_FILE_RESULT_COUNT;

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
}
