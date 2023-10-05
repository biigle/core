<?php

use Biigle\Label;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateLabelSourcesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
        | A label source might be an external database like WoRMS (http://www.marinespecies.org).
        | Labels may be imported from these external sources and use this table to
        | retain a clear reference back to their source.
        */
        Schema::create('label_sources', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128);

            $table->string('description');

            // each label source name must be unique since it is used to locate the
            // label source adapter
            $table->unique('name');

            // NO timestamps
        });

        // create WoRMS label source because there alerady may be labels with a
        // WoRMS aphia ID
        $wormsSourceId = DB::table('label_sources')->insertGetId([
            'name' => 'worms',
            'description' => 'The WoRMS database (http://www.marinespecies.org/).',
        ]);

        Schema::table('labels', function (Blueprint $table) {
            // this is the ID of the label in the external label source (DB)
            // we don't know what type of ID the label source uses, so we take a string
            // which can contain anything
            $table->string('source_id')->nullable();

            $table->integer('label_source_id')->unsigned()->nullable();
            $table->foreign('label_source_id')
                ->references('id')
                ->on('label_sources')
                  // don't delete label sources if there are still labels from it
                ->onDelete('restrict');
        });

        Label::whereNotNull('aphia_id')->chunkById(500, function ($labels) use ($wormsSourceId) {
            foreach ($labels as $label) {
                $label->source_id = (string) $label->aphia_id;
                $label->label_source_id = $wormsSourceId;
                $label->save();
            }
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->dropColumn('aphia_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->integer('aphia_id')->nullable();
        });

        $wormsSourceId = DB::table('label_sources')
            ->where('name', 'worms')
            ->first()
            ->id;

        Label::where('label_source_id', $wormsSourceId)->chunk(500, function ($labels) {
            foreach ($labels as $label) {
                $label->aphia_id = (int) $label->source_id;
                $label->save();
            }
        });

        Schema::table('labels', function (Blueprint $table) {
            // do this in its own transaction, else it would clash with dropColumn
            $table->dropForeign('labels_label_source_id_foreign');
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->dropColumn('label_source_id');
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->dropColumn('source_id');
        });

        Schema::drop('label_sources');
    }
}
