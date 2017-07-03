<?php

use Biigle\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

class TransformEmailToLowercase extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Transform all emails to lowercase.
        if (DB::connection() instanceof Illuminate\Database\PostgresConnection) {
            DB::statement('UPDATE users SET email=lower(email)');

            // Create unique index instead of constraint to enforce case insensitive
            // uniqueness of emails.
            DB::statement('ALTER TABLE users DROP CONSTRAINT users_email_unique');
            DB::statement('CREATE UNIQUE INDEX users_email_unique ON users (lower(email))');
        } else {
            foreach (User::select('id', 'email') as $user) {
                // The new email attribute setter function will handle the
                // transformation to lower case.
                $user->email = $user->email;
                $user->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function ($table) {
            if (DB::connection() instanceof Illuminate\Database\PostgresConnection) {
                DB::statement('DROP INDEX users_email_unique');
                $table->unique('email');
            }
        });
    }
}
