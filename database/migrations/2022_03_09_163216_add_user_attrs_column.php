<?php

use Biigle\User;
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
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('settings', 'attrs');
        });

        User::whereNotNull('attrs')->eachById(function ($user) {
            $attrs = $user->attrs;

            // Somehow this was possible.
            if (empty($attrs)) {
                $user->attrs = null;
            } else {
                $user->attrs = ['settings' => $attrs];
            }

            $user->save();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        User::whereNotNull('attrs')->eachById(function ($user) {
            $attrs = $user->attrs;
            if (array_key_exists('settings', $attrs)) {
                $user->attrs = $attrs['settings'];
            } else {
                $user->attrs = null;
            }

            $user->save();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('attrs', 'settings');
        });
    }
};
