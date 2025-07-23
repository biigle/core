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
    private function compileFilterConditions(Builder $query, bool $union, array $filters): void
    {
        if ($union) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters as $filterName => $filterValues) {
                    if ($filterName === 'filename') {
                        $this->applyFilenameFilters($q, $filterValues, true);
                    } else {
                        $toInclude = array_filter($filterValues, fn ($num) => $num > 0);
                        $toExclude = array_map('abs', array_filter($filterValues, fn ($num) => $num < 0));

                        foreach ($toInclude as $valueToInclude) {
                            $q->orWhere($filterName, $valueToInclude);
                        }

                        foreach ($toExclude as $valueToExclude) {
                            $q->orWhereNot($filterName, $valueToExclude);
                        }
                    }
                }
            });
        } else {
            foreach ($filters as $filterName => $filterValues) {
                if ($filterName === 'filename') {
                    $this->applyFilenameFilters($query, $filterValues, false);
                } else {
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

    /**
     * Apply filename filters to the query
     */
    private function applyFilenameFilters(Builder $query, array $patterns, bool $union): void
    {
        if ($union) {
            foreach ($patterns as $pattern) {
                if (str_starts_with($pattern, '-')) {
                    // Negative pattern (exclude)
                    $cleanPattern = str_replace('*', '%', substr($pattern, 1));
                    $query->orWhereNot('filename', 'ilike', $cleanPattern);
                } else {
                    // Positive pattern (include)
                    $cleanPattern = str_replace('*', '%', $pattern);
                    $query->orWhere('filename', 'ilike', $cleanPattern);
                }
            }
        } else {
            foreach ($patterns as $pattern) {
                if (str_starts_with($pattern, '-')) {
                    // Negative pattern (exclude)
                    $cleanPattern = str_replace('*', '%', substr($pattern, 1));
                    $query->whereNot('filename', 'ilike', $cleanPattern);
                } else {
                    // Positive pattern (include)
                    $cleanPattern = str_replace('*', '%', $pattern);
                    $query->where('filename', 'ilike', $cleanPattern);
                }
            }
        }
    }
}
