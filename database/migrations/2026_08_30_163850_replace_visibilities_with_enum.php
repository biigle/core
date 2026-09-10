<?php

use Biigle\Visibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
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

        foreach ($map as $oldId => $newId) {
            DB::table('label_trees')
                ->where('visibility_id', $oldId)
                ->update(['visibility_id' => $newId]);
        }

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
            ['id' => Visibility::publicId(), 'name' => 'public'],
            ['id' => Visibility::privateId(), 'name' => 'private'],
        ]);

        Schema::table('label_trees', function (Blueprint $t) {
            $t->foreign('visibility_id')
                ->references('id')
                ->on('visibilities')
                ->onDelete('restrict');
        });
    }
};
