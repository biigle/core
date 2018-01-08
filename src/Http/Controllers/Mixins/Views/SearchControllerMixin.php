<?php

namespace Biigle\Modules\Export\Http\Controllers\Mixins\Views;

use DB;
use Biigle\User;
use Biigle\Volume;
use Biigle\Project;
use Biigle\Modules\Export\Report;

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
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $queryBuilder = $queryBuilder->where(function ($q) use ($query, $operator) {
                    $q->where('reports.source_type', Volume::class)
                        ->whereExists(function ($q) use ($query, $operator) {
                            $q->select(DB::raw(1))
                                ->from('reports')
                                ->join('volumes', 'reports.source_id', '=', 'volumes.id')
                                ->where('volumes.name', $operator, "%{$query}%");
                        });
                })
                ->orWhere(function ($q) use ($query, $operator) {
                    $q->where('reports.source_type', Project::class)
                        ->whereExists(function ($q) use ($query, $operator) {
                            $q->select(DB::raw(1))
                                ->from('reports')
                                ->join('projects', 'reports.source_id', '=', 'projects.id')
                                ->where('projects.name', $operator, "%{$query}%");
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
