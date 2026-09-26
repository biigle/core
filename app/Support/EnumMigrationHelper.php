<?php

namespace Biigle\Support;

use DB;
use Illuminate\Database\Schema\Blueprint;
use Schema;

class EnumMigrationHelper
{
    /**
     * Helper to migrate certain tables with "static" values (roles, media_types, ...) to enums:
     * - Removes all given foreign key constraints
     * - Changes DB values to the enum values supplied by $map
     * - Drops the specified table
     * - Removes the _id suffix from the column name
     *
     * To update all values atomically, an SQL query like this is built:
     * UPDATE table_name
     * SET column_name = CASE column_name
     *  when old1 then new1
     *  when old2 then new2
     *  ...
     *  else column_name
     * end
     * where column_name in (old1, old2, ...);
     * @param array $map [$oldId => $newId]
     * @param string $tableName
     * @param array $foreignKeys [[table name, column name, foreign key constraint name], ...]. If the
     * foreign key constraint name is not supplied, the default name is constructed
     * @return void
     */
    public static function replaceStaticTableWithEnum(array $map, string $tableName, array $foreignKeys)
    {
        $cases = '';
        $ids = [];
        foreach ($map as $oldId => $newId) {
            $cases .= "WHEN $oldId THEN $newId ";
            $ids[] = $oldId;
        }

        foreach ($foreignKeys as $foreignKey) {
            [$table, $column] = $foreignKey;
            $constraint = $foreignKey[2] ?? "{$table}_{$column}_foreign";

            Schema::table($table, fn (Blueprint $t) => $t->dropForeign($constraint));

            foreach ($map as $oldId => $newId) {
                DB::table($table)
                    ->whereIn($column, $ids)
                    ->update([
                        DB::raw("(CASE $column $cases END)")
                    ]);
            }

            if (str_ends_with($column, '_id')) {
                Schema::table($table, function (Blueprint $t) use ($column) {
                    $newColumn = substr($column, 0, -3);
                    $t->renameColumn($column, $newColumn);
                });
            }
        }

        Schema::dropIfExists($tableName);
    }

    /**
     * Creates foreign keys from a list and renames existing columns by adding an _id suffix. This assumes
     * that the _id suffix was previously removed with `replaceStaticTableWithEnum`
     * @param array $foreignKeys See `replaceStaticTableWithEnum`
     * @param string $tableName
     * @return void
     */
    public static function createForeignKeys(array $foreignKeys, string $tableName)
    {
        foreach ($foreignKeys as [$table, $column]) {
            if (str_ends_with($column, '_id')) {
                $oldColumn = substr($column, 0, -3);
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
