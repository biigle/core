<?php

use Biigle\Modules\Reports\Report;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $disk = Storage::disk(config('reports.storage_disk'));

        Report::eachById(function ($report) use ($disk) {
            $generator = $report->getReportGenerator();
            $disk->move($report->id, $report->id.'.'.$generator->extension);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $disk = Storage::disk(config('reports.storage_disk'));

        Report::eachById(function ($report) use ($disk) {
            $generator = $report->getReportGenerator();
            $disk->move($report->id.'.'.$generator->extension, $report->id);
        });
    }
};
