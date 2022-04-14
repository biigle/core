<?php

use Biigle\Modules\Reports\Report;
use Exception;
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
        try {
            $disk = Storage::disk(config('reports.storage_disk'));
        } catch (Exception $e) {
            // Do not migrate if storage disk is not configured.
            return;
        }

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
        try {
            $disk = Storage::disk(config('reports.storage_disk'));
        } catch (Exception $e) {
            // Do not migrate if storage disk is not configured.
            return;
        }

        Report::eachById(function ($report) use ($disk) {
            $generator = $report->getReportGenerator();
            $disk->move($report->id.'.'.$generator->extension, $report->id);
        });
    }
};
