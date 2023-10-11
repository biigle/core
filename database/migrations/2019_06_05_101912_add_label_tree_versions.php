<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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

            $table->integer('label_tree_id')->unsigned()->index();
            $table->foreign('label_tree_id')
                ->references('id')
                ->on('label_trees')
                ->onDelete('cascade');

            $table->unique(['name', 'label_tree_id']);
        });

        Schema::table('label_trees', function (Blueprint $table) {
            $table->integer('version_id')->unsigned()->nullable()->unique();
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
