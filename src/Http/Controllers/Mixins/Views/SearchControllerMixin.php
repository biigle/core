<?php

namespace Biigle\Modules\Reports\Http\Controllers\Mixins\Views;

use DB;
use Biigle\User;
use Biigle\Volume;
use Biigle\Project;
use Biigle\Video;
use Biigle\Modules\Reports\Report;

class SearchControllerMixin
{
    /**
     * Add report results to the search view.
     *
     * @param User $user
     * @param string $query
     * @param string $type
     *
     * @return array
     */
    public function index(User $user, $query, $type)
    {
        $queryBuilder = Report::where('reports.user_id', '=', $user->id);

        if ($query) {
            $queryBuilder = $queryBuilder
                ->where(function ($q) use ($query) {
                    $q->where('reports.source_type', Volume::class)
                        ->whereExists(function ($q) use ($query) {
                            $q->select(DB::raw(1))
                                ->from('reports')
                                ->join('volumes', 'reports.source_id', '=', 'volumes.id')
                                ->where('volumes.name', 'like', "%{$query}%");
                        });
                })
                ->orWhere(function ($q) use ($query) {
                    $q->where('reports.source_type', Project::class)
                        ->whereExists(function ($q) use ($query) {
                            $q->select(DB::raw(1))
                                ->from('reports')
                                ->join('projects', 'reports.source_id', '=', 'projects.id')
                                ->where('projects.name', 'like', "%{$query}%");
                        });
                })
                ->orWhere(function ($q) use ($query) {
                    $q->where('reports.source_type', Video::class)
                        ->whereExists(function ($q) use ($query) {
                            $q->select(DB::raw(1))
                                ->from('reports')
                                ->join('videos', 'reports.source_id', '=', 'videos.id')
                                ->where('videos.name', 'like', "%{$query}%");
                        });
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
