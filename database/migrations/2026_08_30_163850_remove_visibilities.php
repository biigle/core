<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('label_trees', fn (Blueprint $t) => $t->dropForeign(['visibility_id']));
        Schema::dropIfExists('visibilities');
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
            ['name' => 'public'],
            ['name' => 'private'],
        ]);

        Schema::table('label_trees', function (Blueprint $t) {
            $t->foreign('visibility_id')
                ->references('id')
                ->on('visibilities')
                ->onDelete('restrict');
        });
    }
};
