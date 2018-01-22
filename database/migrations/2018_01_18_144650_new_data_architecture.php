<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class NewDataArchitecture extends Migration
{
    /**
     * Run the migrations.
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
        // Assign existing annotations to the oldest project?

        // Schema::table('annotations', function (Blueprint $table) {
        //     $table->integer('project_volume_id')->unsigned();
        //     $table->foreign('project_volume_id')
        //           ->references('id')
        //           ->on('project_volume')
        //           ->onDelete('cascade');

        //     $table->dropForeign(['image_id']);
        //     $table->foreign('image_id')
        //           ->references('id')
        //           ->on('images')
        //           // A volume must not be deleted if an image still has annotations.
        //           // All project volumes must be deleted first, which will delete the
        //           // annotations (see above).
        //           ->onDelete('restrict');
        // });

        // Schema::table('image_labels', function (Blueprint $table) {
        //     $table->integer('project_volume_id')->unsigned();
        //     $table->foreign('project_volume_id')
        //           ->references('id')
        //           ->on('project_volume')
        //           ->onDelete('cascade');

        //     $table->dropForeign(['image_id']);
        //     $table->foreign('image_id')
        //           ->references('id')
        //           ->on('images')
        //           // A volume must not be deleted if an image still has image labels.
        //           // All project volumes must be deleted first, which will delete the
        //           // image labels (see above).
        //           ->onDelete('restrict');

        //     $table->dropUnique(['image_id', 'label_id']);
        //     // Each image may have the same label attached only once per project volume.
        //     $table->unique(['image_id', 'label_id', 'project_volume_id']);
        // });

        // Schema::table('volumes', function (Blueprint $table) {
        //     $table->integer('visibility_id')->unsigned();
        //     $table->foreign('visibility_id')
        //           ->references('id')
        //           ->on('visibilities')
        //           // don't delete a visibility that is in use
        //           ->onDelete('restrict');
        // });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Schema::table('volumes', function (Blueprint $table) {
        //     $table->dropColumn('visibility_id');
        // });

        // Schema::table('image_labels', function (Blueprint $table) {
        //     // This drops the foreign and unique constraints, too.
        //     $table->dropColumn('project_volume_id');

        //     $table->dropForeign(['image_id']);
        //     $table->foreign('image_id')
        //           ->references('id')
        //           ->on('images')
        //           ->onDelete('cascade');

        //     $table->unique(['image_id', 'label_id']);
        // });

        // Schema::table('annotations', function (Blueprint $table) {
        //     $table->dropColumn('project_volume_id');

        //     $table->dropForeign(['image_id']);
        //     $table->foreign('image_id')
        //           ->references('id')
        //           ->on('images')
        //           ->onDelete('cascade');
        // });

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
