<?php
namespace Biigle\Modules\Largo\Traits;

use Illuminate\Database\Eloquent\Builder;

trait CompileFilters
{
    /**
    * Compile Largo filter(s) that were requested and add them to the query
    * @param Builder Query $query To add filters to
    * @param bool $union Whether filters are considered inclusive (OR) or exclusive (AND)
    * @param array $filters Array of filters to add to the query in the form `filterName => filterValue`
    */
    private function compileFilterConditions(Builder $query, bool $union, array $filters): void
    {
        if ($union) {

            $query->where(function ($q) use ($filters) {
                foreach ($filters as $filterName => $filterValues) {
                    $toInclude = array_filter($filterValues, function($num) {
                        return $num > 0;
                    });

                    $toExclude = array_map('abs', array_filter($filterValues, function($num) {
                        return $num < 0;
                    }));

                    if (!empty($toInclude)) {
                        $q->whereIn($filterName, $toInclude, 'or');
                    }

                    if (!empty($toExclude)) {
                        $q->whereNotIn($filterName, $toExclude, 'or');
                    }
                }
            });
        } else {
            foreach ($filters as $filterName => $filterValues) {
                foreach ($filterValues as $value) {
                    if ($value < 0) {
                        $query->whereNot($filterName, abs($value));
                    } else {
                        $query->where($filterName, $value);
                    }
                }
            }
        }
    }
}
