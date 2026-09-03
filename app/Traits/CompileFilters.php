<?php
namespace Biigle\Traits;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

trait CompileFilters
{
    /**
    * Compile Largo filter(s) that were requested and add them to the query
    * @param string $annotationType 'video' or 'image' depending on the nature of the support of the request
    * @param Builder $query Query to add filters to
    * @param bool $union Whether filters are considered inclusive (OR) or exclusive (AND)
    * @param array $filters Array of filters to add to the query in the form `filterName => filterValue`
    */
    protected function compileFilterConditions(string $annotationType, Builder $query, bool $union, array $filters): void
    {
        $boolean = $union ? 'or' : 'and';

        $query->where(function ($q) use ($annotationType, $filters, $boolean) {
            foreach ($filters as $filterName => $filterValues) {
                $filterValues = $this->normalizeFilterValues($annotationType, $filterName, $filterValues);

                foreach ($filterValues as $normalizedFilter) {
                    $this->applyFilterCondition($q, $normalizedFilter, $boolean);
                }
            }
        });
    }

    /**
     * Normalize filter values based on the filter type.
     *
     * Handles different filter types (filename, dates, default) and extracts negation prefixes.
     * Returns an array of normalized filter arrays suitable for query application.
     *
     * @param string $filterName The name of the filter to apply
     * @param array $filterValues The raw filter values from the request
     *
     * @return array An array of normalized filter arrays with keys:
     *                - field: The database field name
     *                - operator: The SQL operator (=, >, <, ilike, etc.)
     *                - value: The filter value
     *                - negated: Whether the filter should be negated
     */
    private function normalizeFilterValues(string $annotationType, string $filterName, array $filterValues): array
    {
        return array_map(function ($value) use ($filterName, $annotationType) {
            $isNegated = is_string($value) && str_starts_with($value, '-');

            return match ($filterName) {
                'filename' => $this->normalizeFilenameFilter($value, $isNegated),
                'created_at', 'updated_at' => $this->normalizeDateFilter($annotationType, $filterName, $value, $isNegated),
                default => $this->normalizeDefaultFilter($filterName, $value, $isNegated),
            };
        }, $filterValues);
    }

    /**
     * Normalize a filename filter with wildcard support.
     *
     * Converts asterisks (*) to SQL LIKE wildcards (%) and prepares the filter for case-insensitive
     * matching using the ILIKE operator.
     *
     * @param mixed $value The raw filter value, optionally prefixed with '-' for negation
     * @param bool $isNegated Whether the filter value was prefixed with '-'
     *
     * @return array A normalized filter array with keys:
     *                - field: 'filename'
     *                - operator: 'ilike'
     *                - value: The filename pattern with * converted to %
     *                - negated: Whether the filter should be negated
     */
    private function normalizeFilenameFilter($value, bool $isNegated): array
    {
        $actualValue = $isNegated ? substr($value, 1) : $value;

        return [
            'field' => 'filename',
            'operator' => 'ilike',
            'value' => str_replace('*', '%', $actualValue),
            'negated' => $isNegated,
        ];
    }

    /**
     * Normalize a date filter with operator and time boundary handling.
     *
     * Handles date comparison operators (gt, lt, eq) and applies appropriate time boundaries:
     * - 'gt' (greater than): uses end of day
     * - 'lt' (less than): uses start of day
     * - 'eq' (equals): uses the exact date value
     * - 'neq' (not equals): uses the exact date value
     *
     * @param string $filterName The date field name ('created_at' or 'updated_at')
     * @param array $value An array with keys:
     *                      - operator: The comparison operator ('gt', 'lt', 'eq', neq)
     *                      - ref: The table/column reference
     *                      - date: The date of reference
     * @param bool $isNegated Whether the filter should be negated
     *
     * @return array A normalized filter array with keys:
     *                 - field: The fully qualified field name with ::date cast
     *                 - operator: The SQL comparison operator (>, <, =, !=)
     *                 - value: The date value string with appropriate time boundaries
     *                 - negated: not used here
     *                 - exact_date: if using equality, will force the conversion of the dates on PostrgreSQL
     */
    private function normalizeDateFilter(string $annotationType, string $filterName, array $value, bool $isNegated): array
    {
        $dateValue = match ($value['operator']) {
            'gt' => Carbon::createFromFormat('Y-m-d', $value['date'])->endOfDay()->toDateTimeString(),
            'lt' => Carbon::createFromFormat('Y-m-d', $value['date'])->startOfDay()->toDateTimeString(),
            'eq' => $value['date'],
            'neq' => $value['date'],
            default => throw new \Exception('Operator not recognized'),
        };

        $field = $annotationType."_{$value['ref']}s.{$filterName}";

        $operator = match ($value['operator']) {
            'gt' => '>',
            'lt' => '<',
            'eq' => '=',
            'neq' => '!=',
        };

        return [
            'field' => $field,
            'operator' => $operator,
            'value' => $dateValue,
            'negated' => $isNegated,
            'exact_date' => str_contains($operator, '='),
        ];
    }

    /**
     * Normalize a default filter.
     *
     * Handles generic filters that use exact equality matching. Extracts negation prefix if present.
     *
     * @param string $filterName The field to query
     * @param string $value The raw filter value, optionally prefixed with '-' for negation
     * @param bool $isNegated Whether the filter value was prefixed with '-'
     *
     * @return array A normalized filter array with keys:
     *               - field: The database field name
     *               - operator: '='
     *               - value: The filter value without negation prefix
     *               - negated: Whether the filter should be negated
     */
    private function normalizeDefaultFilter(string $filterName, string $value, bool $isNegated): array
    {
        $actualValue = $isNegated ? substr($value, 1) : $value;

        return [
            'field' => $filterName,
            'operator' => '=',
            'value' => $actualValue,
            'negated' => $isNegated,
        ];
    }

    /**
     * Apply a single normalized filter condition to the query builder.
     *
     * Adds either a where() or whereNot() clause depending on the negated flag.
     *
     * @param \Illuminate\Database\Query\Builder|\Illuminate\Database\Eloquent\Builder $q
     *        The query builder instance to apply the filter to
     * @param array $filter A normalized filter array with keys:
     *                      - field: The database field name
     *                      - operator: The SQL operator
     *                      - value: The filter value
     *                      - negated: Whether to use whereNot instead of where
     * @param string $boolean The boolean operator for combining conditions ('and' or 'or')
     *
     * @return void
     */
    private function applyFilterCondition($q, array $filter, string $boolean): void
    {
        if ($filter['negated']) {
            if (isset($filter['exact_date']) && $filter['exact_date']) {
                $q->whereNot(fn ($query) => $query->whereDate($filter['field'], $filter['operator'], $filter['value'], $boolean));
            } else {
                $q->whereNot($filter['field'], $filter['operator'], $filter['value'], $boolean);
            }
        } else {
            if (isset($filter['exact_date']) && $filter['exact_date']) {
                $q->whereDate($filter['field'], $filter['operator'], $filter['value'], $boolean);
            } else {
                $q->where($filter['field'], $filter['operator'], $filter['value'], $boolean);
            }
        }
    }
}
