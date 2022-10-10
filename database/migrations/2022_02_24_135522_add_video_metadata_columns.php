<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('videos', function (Blueprint $table) {
            // Column names are consistent with image attributes.
            $table->json('lat')->nullable();
            $table->json('lng')->nullable();
            $table->json('taken_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('videos', function ($table) {
            $table->dropColumn('lat');
            $table->dropColumn('lng');
            $table->dropColumn('taken_at');
        });
    }
};
