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
     * @param array $map [$oldId => $newId]
     * @param string $tableName
     * @param array $foreignKeys [[table name, column name, foreign key constraint name], ...]. If the
     * foreign key constraint name is not supplied, the default name is constructed
     * @param bool $dropIdSuffix If set to `true`, remove the _id suffix from the foreign key column
     * @return void
     */
    public static function replaceStaticTableWithEnum(array $map, string $tableName, array $foreignKeys, bool $dropIdSuffix = false)
    {
        foreach ($foreignKeys as $foreignKey) {
            [$table, $column] = $foreignKey;
            $constraint = $foreignKey[2] ?? "{$table}_{$column}_foreign";

            Schema::table($table, fn (Blueprint $t) => $t->dropForeign($constraint));

            foreach ($map as $oldId => $newId) {
                DB::table($table)
                    ->where($column, $oldId)
                    ->update([$column => $newId]);
            }

            if ($dropIdSuffix && str_ends_with($column, '_id')) {
                Schema::table($table, function (Blueprint $t) use ($column) {
                    $newColumn = substr($column, 0, -3);
                    $t->renameColumn($column, $newColumn);
                });
            }
        }

        Schema::dropIfExists($tableName);
    }

    /**
     * Creates foreign keys from a list
     * @param array $foreignKeys See `replaceStaticTableWithEnum`
     * @param string $tableName
     * @param bool $addIdSuffix If `true`, add an _id suffix to the foreign key columns if they originally ended with _id.
     * This assumes that the _id suffix was previously removed by setting `$dropIdSuffix` to `true` in `replaceStaticTableWithEnum`
     * @return void
     */
    public static function createForeignKeys(array $foreignKeys, string $tableName, bool $addIdSuffix = false)
    {
        foreach ($foreignKeys as [$table, $column]) {
            if ($addIdSuffix && str_ends_with($column, '_id')) {
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
