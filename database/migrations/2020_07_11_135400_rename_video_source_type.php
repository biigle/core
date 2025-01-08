<?php

use Biigle\Report;
use Illuminate\Database\Migrations\Migration;

class RenameVideoSourceType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Report::where('source_type', 'Biigle\Modules\Videos\Video')
            ->update(['source_type' => 'Biigle\Video']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Report::where('source_type', 'Biigle\Video')
            ->update(['source_type' => 'Biigle\Modules\Videos\Video']);
    }
}
