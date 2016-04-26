<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTransectAttrsAttribute extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('transects', function ($table) {
            // don't call it "attributes" because Eloquent models already have an
            // "attributes" variable!
            $table->json('attrs')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('transects', function ($table) {
            $table->dropColumn('attrs');
        });
    }
}
