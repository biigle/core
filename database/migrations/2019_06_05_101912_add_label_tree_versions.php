<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddLabelTreeVersions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('label_tree_versions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 256);
            $table->text('description')->nullable();

            $table->integer('label_tree_id')->unsigned();
            $table->foreign('label_tree_id')
                  ->references('id')
                  ->on('label_trees')
                  ->onDelete('cascade');
        });

        Schema::table('label_trees', function (Blueprint $table) {
            $table->integer('version_id')->unsigned()->nullable();
            $table->foreign('version_id')
                  ->references('id')
                  ->on('label_tree_versions')
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
        Schema::table('label_trees', function (Blueprint $table) {
            $table->dropColumn('version_id');
        });

        Schema::dropIfExists('label_tree_versions');
    }
}
