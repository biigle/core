<?php

use Biigle\Role;
use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private $foreignKeys = [
        ['users', 'role'],
        ['project_user', 'project_role'],
        ['label_tree_user', 'role'],
        ['project_invitations', 'role'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('roles')->pluck('id', 'name');
        $map = [
            $oldIds['admin'] => Role::ADMIN->value,
            $oldIds['editor'] => Role::EDITOR->value,
            $oldIds['guest'] => Role::GUEST->value,
            $oldIds['expert'] => Role::EXPERT->value,
        ];

        EnumMigrationHelper::replaceStaticTableWithEnum($map, 'roles', $this->foreignKeys);
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
            ['id' => Role::ADMIN->value, 'name' => 'admin'],
            ['id' => Role::EDITOR->value, 'name' => 'editor'],
            ['id' => Role::GUEST->value, 'name' => 'guest'],
            ['id' => Role::EXPERT->value, 'name' => 'expert'],
        ]);

        EnumMigrationHelper::createForeignKeys($this->foreignKeys, 'roles');
    }
};
