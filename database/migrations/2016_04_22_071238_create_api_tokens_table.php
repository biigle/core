<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateApiTokensTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         | Users are allowed to create multiple API tokens. These tokens act just like
         | passwords. Each token is intended to be used with only one external
         | application, so users are able to disallow connections for each individual
         | external application by deleting individual tokens. Previously there was only
         | one token which would have affected *all* connected applications if deleted.
         */
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->increments('id');
            $table->timestamps();

            // the user, this token belongs to
            $table->integer('owner_id')->unsigned();
            $table->foreign('owner_id')
                  ->references('id')
                  ->on('users')
                  // delete tokens of a user if they are deleted
                  ->onDelete('cascade');

            $table->string('purpose');
            // hashing uses bcrypt so the token hash is always 60 chars long
            $table->string('hash', 60);
        });

        /*
         | This column is no longer needed now.
         | Do two separate operations for compatibility with SQLite!
         */
        Schema::table('users', function ($table) {
            $table->dropUnique('users_api_key_unique');
        });

        Schema::table('users', function ($table) {
            $table->dropColumn('api_key');
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
            $table->string('api_key', 32)
                ->nullable()
                ->index()
                ->unique();
        });

        Schema::drop('api_tokens');
    }
}
