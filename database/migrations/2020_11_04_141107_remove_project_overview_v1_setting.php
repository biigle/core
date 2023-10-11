<?php

use Biigle\User;
use Illuminate\Database\Migrations\Migration;

class RemoveProjectOverviewV1Setting extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        User::whereNotNull('settings->project_overview_v1')
            ->eachById(function ($user) {
                $settings = $user->settings;
                unset($settings['project_overview_v1']);
                $user->settings = $settings;
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
        //
    }
}
