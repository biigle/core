<?php

namespace Biigle\Support;

use DB;
use Illuminate\Database\Schema\Blueprint;
use Schema;

class EnumMigrationHelper
{
    /**
     * Drops the specified table from the DB and removes foreign key constraints
     * @param array $map [$oldId => $newId]
     * @param string $tableName
     * @param array $foreignKeys [[table name, column name, foreign key constraint name], ...]. If the
     * foreign key constraint name is not supplied, the default name is constructed
     * @return void
     */
    public static function replaceStaticTableWithEnum(array $map, string $tableName, array $foreignKeys)
    {
        foreach ($foreignKeys as $foreignKey) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign($constraint));

            [$table, $column] = $foreignKey;
            $constraint = $foreignKey[2] ?? "{$table}_{$column}_foreign";

            foreach ($map as $oldId => $newId) {
                DB::table($table)
                    ->where($column, $oldId)
                    ->update([$column => $newId]);
            }
        }

        Schema::dropIfExists($tableName);
    }

    /**
     * Creates foreign keys from a list
     * @param array $foreignKeys See `replaceStaticTableWithEnum`
     * @param string $tableName
     * @return void
     */
    public static function createForeignKeys(array $foreignKeys, string $tableName)
    {
        foreach ($foreignKeys as [$table, $column]) {
            Schema::table($table, function (Blueprint $t) use ($column, $tableName) {
                $t->foreign($column)
                    ->references('id')
                    ->on($tableName)
                    ->onDelete('restrict');
            });
        }
    }
}
