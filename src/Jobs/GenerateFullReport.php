<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Dias\Jobs\Job;
use Dias\Project;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateFullReport extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    private $project;

    /**
     * Create a new job instance.
     *
     * @param Project $project The project for which the report should be generated.
     *
     * @return void
     */
    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        DB::reconnect();
        $transects = DB::select('SELECT transects.id, transects.name FROM transects, project_transect WHERE project_transect.project_id = '.$this->project->id.' AND transects.id = project_transect.transect_id');
        $cmd=$this->project->name." ";
        foreach ($transects as $transect) {
            DB::statement('copy (SELECT labels.name, images.filename, annotations.id, annotations.shape_id, annotation_labels.label_id, shapes.name, annotations.points, annotation_labels.user_id FROM labels, annotations, images, annotation_labels, shapes WHERE images.transect_id = '.$transect->id.' AND annotations.image_id = images.id AND shapes.id = annotations.shape_id AND annotation_labels.annotation_id = annotations.id AND labels.id=annotation_labels.label_id and annotation_labels.annotation_id = annotations.id) to \'/tmp/'.$transect->name.'_full.csv\' csv');
            $cmd.=$transect->name.'_full.csv ';
        }
        system('/usr/bin/python /home/vagrant/dias/vendor/dias/export/src/Scripts/fullreport.py '.$cmd);
    }
}