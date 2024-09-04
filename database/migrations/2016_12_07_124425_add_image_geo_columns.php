<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddImageGeoColumns extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         | Add columns for additional information on an image. This includes the
         | coordinates and time where the image was taken.
         */
        Schema::table('images', function (Blueprint $table) {
            $table->float('lat')->nullable();
            $table->float('lng')->nullable();

            $table->timestamp('taken_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng', 'taken_at']);
        });
    }
}
