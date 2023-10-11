<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAnnotationSessionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
        | Annotation sessions are used to group annotations of a transect that were
        | created during a certain time period. All annotations that were created after
        | the begin date and before the end date of an annotation session belong to this
        | session.
        |
        | An annotation session is active when the begin date is past and the end date
        | is not yet past. The creator of the annotation session can choose to hide
        | annotations from other users and/or hide annotations of the own user that don't
        | belong to this annotation session while the annotation session is active.
        */
        Schema::create('annotation_sessions', function (Blueprint $table) {
            $table->increments('id');

            $table->string('name', 256);
            $table->text('description')->nullable();

            $table->integer('transect_id')->unsigned();
            $table->foreign('transect_id')
                ->references('id')
                ->on('transects')
                ->onDelete('cascade');

            $table->timestamps();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');

            $table->boolean('hide_other_users_annotations')->default(false);
            $table->boolean('hide_own_annotations')->default(false);

            // Most often we want to find the currently active annotation session for
            // a given transect. This index should enhance these kinds of queries.
            $table->index(['transect_id', 'starts_at', 'ends_at']);
        });

        /*
        | Annotation sessions are always restricted to a set of users. A session is only
        | active for the users it is restricted to.
        */
        Schema::create('annotation_session_user', function (Blueprint $table) {
            $table->integer('annotation_session_id')->unsigned();
            $table->foreign('annotation_session_id')
                ->references('id')
                ->on('annotation_sessions')
                ->onDelete('cascade');

            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // each user must not be added twice
            $table->unique(['annotation_session_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('annotation_session_user');
        Schema::drop('annotation_sessions');
    }
}
