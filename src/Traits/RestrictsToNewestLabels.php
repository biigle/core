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
        // This is a quite inefficient query. Here is why:
        // We could use "select distinct on" directly on the query but this would be
        // overridden by the subsequent select() in self::initQuery(). If we would add
        // the "select distinct on" **after** the select(), we would get invalid syntax:
        // "select *, distinct on".
        return $query->whereIn("{$table}.id", function ($query) use ($table) {
            return $query->selectRaw('distinct on (annotation_id) id')
                ->from($table)
                ->orderBy('annotation_id', 'desc')
                ->orderBy('id', 'desc')
                ->orderBy('created_at', 'desc');
        });
    }
}
