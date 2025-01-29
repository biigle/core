<?php
namespace Biigle\Modules\Largo\Traits;
use Illuminate\Database\Eloquent\Builder;

trait CompileFilters {
    /**
    *
    * Compile filter(s) that were requested and add them to the query
    * @param Query &$query To add filters to
    * @param bool $union Whether filters are considered inclusive (OR) or exclusive (AND)
    * @param array $filters Array of filters to add to the query
    * @param string $filterName Name of the filter column to apply the  filter to
    */
    private function compileFilterConditions(Builder &$query, bool $union, array $filters, string $filterName): void
    {
        if ($union){
            $included = [];
            $excluded = [];
            foreach ($filters as $filterValue){
                if ($filterValue < 0) {
                    array_push($excluded, abs($filterValue));
                } else {
                    array_push($included, $filterValue);
                }}
            $query->where(function($query) use ($included, $excluded, $filterName) {
                if (count($included) > 0){
                    $query->whereIn($filterName, $included, 'or');
                }
                if (count($excluded) > 0){
                    $query->whereNotIn($filterName, $excluded, 'or');
                }
            });
        } else {
            foreach ($filters as $filterValue){
                if ($filterValue < 0) {
                    $query->whereNot($filterName, abs($filterValue));
                } else {
                    $query->where($filterName, $filterValue);
                }
            }
        }
    }
}

