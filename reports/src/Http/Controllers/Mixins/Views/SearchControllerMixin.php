<?php

namespace Biigle\Modules\Reports\Http\Controllers\Mixins\Views;

use Biigle\Modules\Reports\Report;
use Biigle\Project;
use Biigle\User;
use Biigle\Volume;
use DB;

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
                    $q->where(function ($q) use ($query) {
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
