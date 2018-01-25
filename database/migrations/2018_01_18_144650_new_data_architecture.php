<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class NewDataArchitecture extends Migration
{
    /**
     * Run the migrations.
     * see: https://github.com/BiodataMiningGroup/biigle-core/issues/53
     *
     * @return void
     */
    public function up()
    {
        Schema::table('project_volume', function (Blueprint $table) {
            // Add the ID so we can use on delete cascade on annotations and image
            // labels.
            $table->increments('id');

            // When a project is deleted, all of its project volumes are deleted as well.
            $table->dropForeign('project_transect_project_id_foreign');
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('cascade');

            // A volume must not be deleted if it is still attached to any project.
            $table->dropForeign('project_transect_transect_id_foreign');
            $table->foreign('volume_id')
                ->references('id')
                ->on('volumes')
                ->onDelete('restrict');

            $table->timestamps();
        });

        // TODO migrate existing annotations and image labels before adding the new not
        // null project_volume_id.
        // Assign existing annotations and image labels to the oldest project.

        Schema::table('annotations', function (Blueprint $table) {
            $table->integer('project_volume_id')->unsigned();
            $table->foreign('project_volume_id')
                  ->references('id')
                  ->on('project_volume')
                  ->onDelete('cascade');

            $table->dropForeign(['image_id']);
            $table->foreign('image_id')
                  ->references('id')
                  ->on('images')
                  // A volume must not be deleted if an image still has annotations.
                  // All project volumes must be deleted first, which will delete the
                  // annotations (see above).
                  ->onDelete('restrict');
        });

        Schema::table('image_labels', function (Blueprint $table) {
            $table->integer('project_volume_id')->unsigned();
            $table->foreign('project_volume_id')
                  ->references('id')
                  ->on('project_volume')
                  ->onDelete('cascade');

            $table->dropForeign(['image_id']);
            $table->foreign('image_id')
                  ->references('id')
                  ->on('images')
                  // A volume must not be deleted if an image still has image labels.
                  // All project volumes must be deleted first, which will delete the
                  // image labels (see above).
                  ->onDelete('restrict');

            $table->dropUnique(['image_id', 'label_id']);
            // Each image may have the same label attached only once per project volume.
            $table->unique(['image_id', 'label_id', 'project_volume_id']);
        });

        // TODO migrate existing annotation sessions to be attached to a project and not
        // a volume. They can be duplicated for all projects they affect. They don't
        // require associated users any more. Instead, they affect all project users.
        // Handle conflicting annotation sessions, too. If annotation sessions overlap,
        // cut off the newer one or delete it if it lies completely inside the older one.

        Schema::drop('annotation_session_user');

        Schema::table('annotation_sessions', function (Blueprint $table) {
            $table->dropColumn('volume_id');

            $table->integer('project_id')->unsigned();
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  ->onDelete('cascade');

            $table->index(['project_id', 'starts_at', 'ends_at']);
        });

        // TODO Migrate project admins to be volume admins.
        // There are *only* volume admins for now. Everybody else gets implicit access
        // through the volume visibility or through project membership.
        // Volumes should be private by default.

        Schema::table('volumes', function (Blueprint $table) {
            $table->integer('visibility_id')->unsigned();
            $table->foreign('visibility_id')
                  ->references('id')
                  ->on('visibilities')
                  ->onDelete('restrict');
        });

        // Schema::create('user_volume', function (Blueprint $table) {
        //     $table->integer('volume_id')->unsigned();
        //     $table->foreign('volume_id')
        //           ->references('id')
        //           ->on('volumes')
        //           ->onDelete('cascade');

        //     $table->integer('user_id')->unsigned();
        //     $table->foreign('user_id')
        //           ->references('id')
        //           ->on('users')
        //           ->onDelete('cascade');

        //     $table->integer('role_id')->unsigned();
        //     $table->foreign('role_id')
        //           ->references('id')
        //           ->on('roles')
        //           ->onDelete('restrict');

        //     // each user must not be added twice as a label tree member
        //     $table->unique(['volume_id', 'user_id']);
        // });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Schema::drop('user_volume');

        Schema::table('volumes', function (Blueprint $table) {
            $table->dropColumn('visibility_id');
        });

        Schema::table('annotation_sessions', function (Blueprint $table) {
            $table->dropColumn('project_id');

            $table->integer('volume_id')->unsigned();
            $table->foreign('volume_id')
                  ->references('id')
                  ->on('volumes')
                  ->onDelete('cascade');

            $table->index(['volume_id', 'starts_at', 'ends_at']);
        });

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

            $table->unique(['annotation_session_id', 'user_id']);
        });

        Schema::table('image_labels', function (Blueprint $table) {
            // This drops the foreign and unique constraints, too.
            $table->dropColumn('project_volume_id');

            $table->dropForeign(['image_id']);
            $table->foreign('image_id')
                  ->references('id')
                  ->on('images')
                  ->onDelete('cascade');

            $table->unique(['image_id', 'label_id']);
        });

        Schema::table('annotations', function (Blueprint $table) {
            $table->dropColumn('project_volume_id');

            $table->dropForeign(['image_id']);
            $table->foreign('image_id')
                  ->references('id')
                  ->on('images')
                  ->onDelete('cascade');
        });

        Schema::table('project_volume', function (Blueprint $table) {
            $table->dropColumn(['id', 'created_at', 'updated_at']);

            $table->dropForeign(['project_id']);
            $table->foreign('project_id', 'project_transect_project_id_foreign')
                ->references('id')
                ->on('projects')
                ->onDelete('restrict');

            $table->dropForeign(['volume_id']);
            $table->foreign('volume_id', 'project_transect_transect_id_foreign')
                ->references('id')
                ->on('volumes')
                ->onDelete('cascade');
        });
    }
}
