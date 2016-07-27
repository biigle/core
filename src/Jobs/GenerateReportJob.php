<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Mail;
use Dias\User;
use Dias\Project;
use Dias\Jobs\Job;
use Dias\Modules\Export\Transect;
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
     * Restrict the report to the export areas of the transects
     *
     * @var bool
     */
    protected $restricted;

    /**
     * Create a new job instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param User $user The user to notify of the finished report
     * @param bool $restricted Restrict the report to the export areas of the transects
     *
     * @return void
     */
    public function __construct(Project $project, User $user, $restricted = false)
    {
        $this->user = $user;
        $this->project = $project;
        $this->restricted = $restricted;
    }

    /**
     * Returns the annotation IDs to skip as outside of the transect export area
     *
     * We collect the IDs to skip rather than the IDs to include since there are probably
     * fewer annotations outside of the export area.
     *
     * @param int $id Transect ID
     *
     * @return array Annotation IDs
     */
    protected function getSkipIds($id)
    {
        $skip = [];
        $exportArea = Transect::find($id)->exportArea;

        if (!$exportArea) {
            // take all annotations if no export area is specified
            return $skip;
        }

        $exportArea = [
            // min x
            min($exportArea[0], $exportArea[2]),
            // min y
            min($exportArea[1], $exportArea[3]),
            // max x
            max($exportArea[0], $exportArea[2]),
            // max y
            max($exportArea[1], $exportArea[3]),
        ];

        $handleChunk = function ($annotations) use ($exportArea, &$skip) {
            foreach ($annotations as $annotation) {
                $points = json_decode($annotation->points);
                $size = sizeof($points);
                // Works for circles with 3 elements in $points, too!
                for ($x = 0, $y = 1; $y < $size; $x += 2, $y += 2) {
                    if ($points[$x] >= $exportArea[0] &&
                        $points[$x] <= $exportArea[2] &&
                        $points[$y] >= $exportArea[1] &&
                        $points[$y] <= $exportArea[3]) {
                            // As long as one point of the annotation is inside the
                            // area, don't skip it.
                            continue 2;
                    }
                }

                $skip[] = $annotation->id;
            }
        };

        DB::table('annotations')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $id)
            ->select('annotations.id', 'annotations.points')
            ->chunkById(500, $handleChunk, 'annotations.id');

        return $skip;
    }

    /**
     * Send the email with the link to the report file
     *
     * @param string $type Report type
     * @param string $uuid Refort file UUID for the download link
     * @param string $filetype Type of the report file, e.g. `pdf` or `xls`.
     * @return void
     */
    protected function sendReportMail($type, $uuid, $filetype)
    {
        if ($this->restricted) {
            $filename = "biigle_{$this->project->id}_{$type}_report_restricted.{$filetype}";
        } else {
            $filename = "biigle_{$this->project->id}_{$type}_report.{$filetype}";
        }

        return Mail::send('export::emails.report', [
            'user' => $this->user,
            'project' => $this->project,
            'restricted' => $this->restricted,
            'type' => $type,
            'uuid' => $uuid,
            'filename' => $filename,
        ], function ($mail) use ($type) {
            if ($this->user->firstname && $this->user->lastname) {
                $name = "{$this->user->firstname} {$this->user->lastname}";
            } else {
                $name = null;
            }

            $mail->subject("BIIGLE {$type} report for project {$this->project->name}")
                ->to($this->user->email, $name);
        });
    }
}
