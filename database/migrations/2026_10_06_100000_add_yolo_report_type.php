<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('report_types')->insert(['name' => 'ImageAnnotations\Yolo']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('report_types')->where('name', 'ImageAnnotations\Yolo')->delete();
    }
};
