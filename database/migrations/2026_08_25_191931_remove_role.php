<?php

use Biigle\Enums\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * We decided to replace the role table and other tables that just contain static enumerated values
 * with actual PHP enums
 */
return new class extends Migration {
    private $foreignKeys = [
        ['users', 'role_id'],
        ['project_user', 'project_role_id'],
        ['label_tree_user', 'role_id'],
        ['project_invitations', 'role_id'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // TODO Discuss if we want to "be safe" by mapping here or if it's enough
        // to check in psql/with the migrations that the enum used the same numbers
        // as the db table, in which case mapping is unnecessary
        $oldIds = DB::table('roles')->pluck('id', 'name');
        $map = [
            $oldIds['admin'] => Role::adminId(),
            $oldIds['editor'] => Role::editorId(),
            $oldIds['guest'] => Role::guestId(),
            $oldIds['expert'] => Role::expertId(),
        ];

        // Replace foreign keys with the above IDs
        foreach ($this->foreignKeys as [$table, $column]) {
            foreach ($map as $oldId => $newId) {
                DB::table($table)
                    ->where($column, $oldId)
                    ->update([$column => $newId]);
            }

            Schema::table($table, fn (Blueprint $t) => $t->dropForeign([$column]));
        }
        Schema::dropIfExists('roles');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128)->index();
            $table->unique('name');
        });

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'editor'],
            ['id' => 3, 'name' => 'guest'],
            ['id' => 4, 'name' => 'expert'],
        ]);

        foreach ($this->foreignKeys as [$table, $column]) {
            Schema::table($table, function (Blueprint $t) use ($column) {
                $t->foreign($column)
                    ->references('id')
                    ->on('roles')
                    ->onDelete('restrict');
            });
        }
    }
};
