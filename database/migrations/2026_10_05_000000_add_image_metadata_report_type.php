<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('report_types')->insert([
            'name' => 'ImageMetadata',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('report_types')
            ->where('name', 'ImageMetadata')
            ->delete();
    }
};
