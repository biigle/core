<?php
namespace Biigle\Traits;

use Illuminate\Database\Eloquent\Builder;

trait CompileFilters
{
    /**
    * Compile Largo filter(s) that were requested and add them to the query
    * @param Builder $query Query to add filters to
    * @param bool $union Whether filters are considered inclusive (OR) or exclusive (AND)
    * @param array $filters Array of filters to add to the query in the form `filterName => filterValue`
    */
    protected function compileFilterConditions(Builder $query, bool $union, array $filters): void
    {
        $boolean = $union ? 'or' : 'and';

        $query->where(function ($q) use ($filters, $boolean) {
            foreach ($filters as $filterName => $filterValues) {
                if ($filterName === 'filename') {
                    $operator = 'ilike';
                    $filterValues = array_map(fn ($v) => str_replace('*', '%', $v), $filterValues);
                } else {
                    $operator = '=';
                }

                foreach ($filterValues as $value) {
                    if (str_starts_with($value, '-')) {
                        $q->whereNot($filterName, $operator, substr($value, 1), $boolean);
                    } else {
                        $q->where($filterName, $operator, $value, $boolean);
                    }
                }
            }
        });
    }
}
