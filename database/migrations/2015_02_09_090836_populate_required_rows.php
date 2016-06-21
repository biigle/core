<?php

use Illuminate\Database\Migrations\Migration;

class PopulateRequiredRows extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('visibilities')->insert([
            ['name' => 'public'],
            ['name' => 'private'],
        ]);

        DB::table('roles')->insert([
            ['name' => 'admin'],
            ['name' => 'editor'],
            ['name' => 'guest'],
        ]);

        DB::table('media_types')->insert([
            ['name' => 'time-series'],
            ['name' => 'location-series'],
        ]);

        DB::table('shapes')->insert([
            ['name' => 'Point'],
            ['name' => 'LineString'],
            ['name' => 'Polygon'],
            ['name' => 'Circle'],
            ['name' => 'Rectangle'],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // violates foreign key constraints of a populated database!
        // DB::table('roles')->delete();
        // DB::table('media_types')->delete();
        // DB::table('labels')->delete();
        // DB::table('shapes')->delete();
    }
}
