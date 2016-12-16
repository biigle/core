<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

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
            // lat is bounded by +-90 and lng by +-180 so if we take a float with 11
            // digits and 8 after the decimal point we can store all coordinates with
            // a resolution up to a mm (http://stackoverflow.com/a/9059066/1796523)
            $table->float('lat', 11, 8)->nullable();
            $table->float('lng', 11, 8)->nullable();

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
