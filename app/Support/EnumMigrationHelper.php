<?php

namespace Biigle\Support;

use DB;
use Illuminate\Database\Schema\Blueprint;
use RuntimeException;
use Schema;

class EnumMigrationHelper
{
    /**
     * Helper to migrate certain tables with "static" values (roles, media_types, ...) to enums:
     * - Removes all given foreign key constraints
     * - Changes DB values to the enum values supplied by $map
     * - Drops the specified table
     * - Removes the _id suffix from the column name
     * - Adds a validation constraint for each renamed column, checking that values are within enum [min, max]
     *   (only for new rows, existing rows are guaranteed to be valid, see below)
     *
     * To update all values atomically, an SQL query like this is built:
     * ```UPDATE table_name
     * SET column_name = (CASE column_name
     *  WHEN old1 THEN new1
     *  WHEN old2 THEN new2
     *  ...
     * END) <-- part in parenthesis is built
     * WHERE column_name IN (old1, old2, ...);```
     * @param array $map A mapping from the old DB values to the new enum values: [$oldId => $newId]
     * @param string $tableName Name of the table to be removed
     * @param array $foreignKeys [[table name, column name, foreign key constraint name], ...]. If the
     * foreign key constraint name is not supplied, the default name is constructed
     * @param int $validationMin Used to add a DB constraint for the values. min and max should correspond to the min and max enum values.
     * @param int $validationMax See $validationMin
     * @return void
     */
    public static function replaceStaticTableWithEnum(array $map, string $tableName, array $foreignKeys, int $validationMin, int $validationMax): void
    {
        // Referencing rows with an unmapped ID would keep their old value, which may
        // silently fall into the valid enum range. This check is also what allows the
        // range constraint below to skip the validation scan.
        $unmapped = DB::table($tableName)
            ->whereNotIn('id', array_keys($map))
            ->pluck('id');

        if ($unmapped->isNotEmpty()) {
            throw new RuntimeException("Table {$tableName} contains IDs without enum mapping: {$unmapped->implode(', ')}");
        }

        [$cases, $ids] = self::buildCaseMapping($map);
        foreach ($foreignKeys as $foreignKey) {
            [$table, $column] = $foreignKey;
            $constraint = $foreignKey[2] ?? "{$table}_{$column}_foreign";

            Schema::table($table, fn (Blueprint $t) => $t->dropForeign($constraint));

            if ($cases !== '') {
                DB::table($table)
                    ->whereIn($column, $ids)
                    ->update([
                        $column => DB::raw("CASE $column $cases END")
                    ]);
            }

            if (str_ends_with($column, '_id')) {
                $newColumn = substr($column, 0, -3);
                Schema::table($table, function (Blueprint $t) use ($column, $newColumn) {
                    $t->renameColumn($column, $newColumn);
                });
            } else {
                $newColumn = $column;
            }

            // Existing rows don't need to be validated (which would be a full table
            // scan under an exclusive lock): The dropped foreign key guaranteed that
            // all values exist in the old table and the check above guarantees that
            // all of them were mapped to an enum value. New rows are still checked.
            $rangeConstraintName = "{$table}_{$newColumn}_check";
            $expression = "$newColumn BETWEEN {$validationMin} AND {$validationMax}";
            DB::statement("ALTER TABLE $table ADD CONSTRAINT $rangeConstraintName CHECK ($expression) NOT VALID");
        }

        Schema::dropIfExists($tableName);
    }

    /**
     * Takes a map mapping old to new values and creates a SQL expression for an atomic update.
     * Returns [$cases, $ids]: $cases contains the sql query as a string, $ids contains the old values of the _id column (like role_id, ...)
     * @param array $map Map for old to new values
     * @return array{0: string, 1: array}
     */
    private static function buildCaseMapping(array $map): array
    {
        $cases = '';
        $ids = [];
        foreach ($map as $oldId => $newId) {
            if ((int) $oldId === (int) $newId) {
                continue;
            }
            $cases .= "WHEN $oldId THEN $newId ";
            $ids[] = $oldId;
        }

        return [$cases, $ids];
    }

    /**
     * Creates foreign keys from a list and renames existing columns by adding an _id suffix. This assumes
     * that the _id suffix was previously removed with `replaceStaticTableWithEnum`
     * @param array $foreignKeys See `replaceStaticTableWithEnum`
     * @param string $tableName
     * @return void
     */
    public static function createForeignKeys(array $foreignKeys, string $tableName): void
    {
        foreach ($foreignKeys as [$table, $column]) {
            if (str_ends_with($column, '_id')) {
                $oldColumn = substr($column, 0, -3);
                $rangeConstraintName = "{$table}_{$oldColumn}_check";
                DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$rangeConstraintName}");
                Schema::table($table, function (Blueprint $t) use ($oldColumn, $column) {
                    $t->renameColumn($oldColumn, $column);
                });
            }

            Schema::table($table, function (Blueprint $t) use ($column, $tableName) {
                $t->foreign($column)
                    ->references('id')
                    ->on($tableName)
                    ->onDelete('restrict');
            });
        }
    }
}
