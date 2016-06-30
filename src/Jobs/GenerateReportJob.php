<?php

namespace Dias\Modules\Export\Jobs;

use Dias\Jobs\Job;
use Dias\Project;
use Dias\User;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateReportJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    protected $project;

    /**
     * The user to notify of the finished report
     *
     * @var User
     */
    protected $user;

    /**
     * Create a new job instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param User $user The user to notify of the finished report
     *
     * @return void
     */
    public function __construct(Project $project, User $user)
    {
        $this->project = $project;
        $this->user = $user;
    }
}
