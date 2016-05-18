<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Mail;
use Dias\Jobs\Job;
use Dias\Project;
use Dias\User;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateExtendedReport extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    private $project;
    private $user;

    /**
     * Create a new job instance.
     *
     * @param Project $project The project for which the report should be generated.
     *
     * @return void
     */
    public function __construct(Project $project, User $user)
    {
        $this->project = $project;
        $this->user = $user;
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
        $path = uniqid("/tmp/");
        mkdir($path);
        chmod($path,0777);
        foreach ($transects as $transect) {
            DB::statement('copy (SELECT images.filename, labels.name FROM labels, annotations, annotation_labels, images WHERE annotation_labels.annotation_id = annotations.id AND annotations.image_id = images.id AND labels.id = annotation_labels.label_id AND images.transect_id = '.$transect->id.') to \''.$path."/".$transect->name.'.csv\' csv');
            $cmd.=$path."/".$transect->name.'.csv ';
        }
        $ret = system('/usr/bin/python '.__DIR__.'/../Scripts/extendedreport.py '.$cmd);
        $uuid2path = explode(";",$ret);
        DB::insert('insert into files (id, path) values (?, ?)', $uuid2path);
        Mail::send('export::reportmail', ["uuid"=>$uuid2path[0],"ending"=>".xlsx","name"=>$this->user['attributes']['firstname']." ".$this->user['attributes']['lastname']], function($message){
            $message->to($this->user['attributes']['email'], $this->user['attributes']['firstname']." ".$this->user['attributes']['lastname'])->subject('BiigleDiasReport');
        });
    }
}
