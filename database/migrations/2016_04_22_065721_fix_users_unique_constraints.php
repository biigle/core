<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class FixUsersUniqueConstraints extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         | The email uniqueconstraint was erroneously named 'api_key' although
         | both the api_key and the email attributes should be unique independently
         | from each other.
         */
        Schema::table('users', function ($table) {
            $table->dropUnique('api_key');
            $table->unique('email');
            $table->unique('api_key');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function ($table) {
            $table->dropUnique('email');
            $table->dropUnique('api_key');
            $table->unique('email', 'api_key');
        });
    }
}
