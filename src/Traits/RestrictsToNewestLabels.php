<?php

namespace  Biigle\Modules\Reports\Traits;

use Biigle\Modules\Reports\Volume;
use DB;

trait RestrictsToNewestLabels
{
    /**
     * Callback to be used in a `when` query statement that restricts the results to the
     * newest annotation labels of each annotation.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param string $table Name of the annotation label DB table
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToNewestLabelQuery($query, $table)
    {
        // The subquery join is the fastest approach I could come up with that can be used
        // as an addition to the existing query (instead of rewiriting the entire query,
        // e.g. with a window function).
        //
        // Previously this was a where/in statement with was much slower.
        //
        // It could still be sped up with joins on image_annotations and images in the
        // subquery, filtering it by volume_id, but this will be incompatible with video
        // annotations. Maybe add a $mediaType argument to switch between tables?

        $subquery = DB::table($table)
            ->selectRaw("distinct on (annotation_id) id")
            ->orderBy('annotation_id', 'desc')
            ->orderBy('id', 'desc')
            ->orderBy('created_at', 'desc');

        return $query->joinSub($subquery, 'latest_labels', fn ($join) => $join->on("{$table}.id", '=', 'latest_labels.id'));
    }
}
