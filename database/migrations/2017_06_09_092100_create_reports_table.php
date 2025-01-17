<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('report_types', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128)->index();
            $table->unique('name');
        });

        // Must be compatible with the namespaces of the report generators in
        // \Biigle\Modules\Reports\Support\Reports.
        DB::table('report_types')->insert([
            ['name' => 'Annotations\Area'],
            ['name' => 'Annotations\Basic'],
            ['name' => 'Annotations\Csv'],
            ['name' => 'Annotations\Extended'],
            ['name' => 'Annotations\Full'],
            ['name' => 'ImageLabels\Basic'],
            ['name' => 'ImageLabels\Csv'],
        ]);

        Schema::create('reports', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('user_id');
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->unsignedInteger('type_id');
            $table->foreign('type_id')
                ->references('id')
                ->on('report_types')
                ->onDelete('restrict');

            // Columns for the polymorphic relationship to either volumes or projects.
            $table->morphs('source');

            // Store the source name so can still be displayed even if the source has
            // been deleted.
            $table->string('source_name');

            $table->json('options')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('reports');
        Schema::drop('report_types');
    }
}
