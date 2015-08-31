<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ProjectLabels extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('labels', function ($table) {
            // labels can be project specific or global (project_id is null)
            $table->integer('project_id')->unsigned()->nullable();
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  // delete project specific labels when the project is deleted
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('labels', function ($table) {
            $table->dropForeign('labels_project_id_foreign');
            $table->dropColumn('project_id');
        });
    }
}
