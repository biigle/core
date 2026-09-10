<?php

use Biigle\MediaType;
use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // the volumes table used to be named "transects"
    // but the fk constraint was never renamed
    private $foreignKeys = [
        ['pending_volumes', 'media_type_id', 'pending_volumes_media_type_id_foreign'],
        ['volumes', 'media_type_id', 'transects_media_type_id_foreign'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('media_types')->pluck('id', 'name');
        $map = [
            $oldIds['image'] => MediaType::imageId(),
            $oldIds['video'] => MediaType::videoId(),
        ];

        EnumMigrationHelper::replaceStaticTableWithEnum($map, 'media_types', $this->foreignKeys);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('media_types', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 512)->index();
            $table->unique('name');
        });

        DB::table('media_types')->insert([
            ['id' => MediaType::imageId(), 'name' => 'image'],
            ['id' => MediaType::videoId(), 'name' => 'video'],
        ]);

        EnumMigrationHelper::createForeignKeys($this->foreignKeys, 'media_types');
    }
};
