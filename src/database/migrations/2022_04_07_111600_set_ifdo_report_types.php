<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {

        DB::table('report_types')
            ->where('name', 'ImageIfdo')
            ->update(['name' => 'Ifdo\ImageIfdo']);

        DB::table('report_types')->insert([
            ['name' => 'Ifdo\VideoIfdo'],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('report_types')
            ->where('name', 'Ifdo\VideoIfdo')
            ->delete();

        DB::table('report_types')
            ->where('name', 'Ifdo\ImageIfdo')
            ->update(['name' => 'ImageIfdo']);
    }
};
