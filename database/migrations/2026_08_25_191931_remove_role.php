<?php

use Biigle\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;


/**
 * We decided to replace the role table and other tables that just contain static enumerated values
 * with actual PHP enums
 */
return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('roles')->pluck('id', 'name');
        $map = [
            $oldIds['admin'] => Role::adminId(),
            $oldIds['editor'] => Role::editorId(),
            $oldIds['guest'] => Role::guestId(),
            $oldIds['expert'] => Role::expertId(),
        ];

        // Replace foreign keys with the above IDs
        foreach ([
            ['users', 'role_id'],
            ['project_user', 'project_role_id'],
            ['label_tree_user', 'role_id'],
            ['project_invitations', 'role_id'],
        ] as [$table, $column]) {
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

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('restrict');
        });

        Schema::table('project_user', function (Blueprint $table) {
            $table->foreign('project_role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('restrict');
        });

        Schema::table('label_tree_user', function (Blueprint $table) {
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('restrict');
        });

        Schema::table('project_invitations', function (Blueprint $table) {
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('restrict');
        });
    }
};
