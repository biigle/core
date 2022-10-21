<?php

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
        // System messages were replaced by announcements and the newsletter.
        // Links to system messages in these notifications will no longer work.
        DB::table('notifications')
            ->where('type', 'Biigle\Notifications\NewSystemMessageNotification')
            ->delete();
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
};
