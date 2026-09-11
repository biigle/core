<?php

use Biigle\Support\EnumMigrationHelper;
use Biigle\Visibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private $foreignKeys = [
        ['label_trees', 'visibility_id']
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('visibilities')->pluck('id', 'name');
        $map = [
            $oldIds['public']  => Visibility::publicId(),
            $oldIds['private'] => Visibility::privateId(),
        ];

        EnumMigrationHelper::replaceStaticTableWithEnum($map, 'visibilities', $this->foreignKeys);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('visibilities', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128)->index();
            $table->unique('name');
        });

        DB::table('visibilities')->insert([
            ['id' => Visibility::publicId(), 'name' => 'public'],
            ['id' => Visibility::privateId(), 'name' => 'private'],
        ]);

        EnumMigrationHelper::createForeignKeys($this->foreignKeys, 'visibilities');
    }
};
