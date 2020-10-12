<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Jobs\Job;
use Biigle\Label;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\User;
use Biigle\Volume;
use Carbon\Carbon;
use DB;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ApplyLargoSession extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The queue to push this job to.
     *
     * @var string
     */
    public $queue;

    /**
     * Number of times to retry this job.
     *
     * @var integer
     */
    public $tries = 1;

    /**
     * The job ID.
     *
     * @var string
     */
    public $id;

    /**
     * The user who submitted the Largo session.
     *
     * @var \Biigle\User
     */
    public $user;

    /**
     * Array of all dismissed annotation IDs for each label.
     *
     * @var array
     */
    public $dismissed;

    /**
     * Array of all changed annotation IDs for each label.
     *
     * @var array
     */
    public $changed;

    /**
     * Whether to dismiss labels even if they were created by other users.
     *
     * @var bool
     */
    public $force;

    /**
     * Create a new job instance.
     *
     * @param string $id
     * @param \Biigle\User $user
     * @param array $dismissed
     * @param array $changed
     *
     * @return void
     */
    public function __construct($id, User $user, $dismissed, $changed, $force)
    {
        $this->queue = config('largo.apply_session_queue');
        $this->id = $id;
        $this->user = $user;
        $this->dismissed = $dismissed;
        $this->changed = $changed;
        $this->force = $force;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            DB::transaction(function () {
                [$dismissed, $changed] = $this->ignoreDeletedLabels($this->dismissed, $this->changed);

                $this->applyDismissedLabels($this->user, $dismissed, $this->force);
                $this->applyChangedLabels($this->user, $changed);
                $this->deleteDanglingAnnotations($dismissed, $changed);
            });
        } finally {
            Volume::where('attrs->largo_job_id', $this->id)->each(function ($volume) {
                $attrs = $volume->attrs;
                unset($attrs['largo_job_id']);
                $volume->attrs = $attrs;
                $volume->save();
            });
        }
    }

    /**
     * Removes changes to annotations that should get a new label which no longer exists.
     *
     * @param array $dismissed
     * @param array $changed
     *
     * @return array Containing 'dismissed' and 'changed'
     */
    protected function ignoreDeletedLabels($dismissed, $changed)
    {
        $ids = array_keys($changed);
        $existingIds = Label::whereIn('id', $ids)->pluck('id')->toArray();
        $deletedIds = array_diff($ids, $existingIds);

        if (!empty($deletedIds)) {
            $ignoreAnnotations = [];

            // Remove all annotations from the changed array that should be changed to
            // deleted labels.
            foreach ($deletedIds as $id) {
                $ignoreAnnotations[] = $changed[$id];
                unset($changed[$id]);
            }

            $ignoreAnnotations = array_unique(array_merge(...$ignoreAnnotations));

            // Remove all annotations from the dismissed array that should be ignored.
            // Use outermost array_filter to remove now empty elements.
            $dismissed = array_filter(array_map(function ($ids) use ($ignoreAnnotations) {
                return array_filter($ids, function ($id) use ($ignoreAnnotations) {
                    return !in_array($id, $ignoreAnnotations);
                });
            }, $dismissed));
        }

        return [$dismissed, $changed];
    }

    /**
     * Detach annotation labels that were dismissed in a Largo session.
     *
     * @param \Biigle\User $user
     * @param array $dismissed
     * @param bool $force
     */
    protected function applyDismissedLabels($user, $dismissed, $force)
    {
        foreach ($dismissed as $labelId => $annotationIds) {
            ImageAnnotationLabel::whereIn('annotation_id', $annotationIds)
                ->when(!$force, function ($query) use ($user) {
                    return $query->where('user_id', $user->id);
                })
                ->where('label_id', $labelId)
                ->delete();
        }
    }

    /**
     * Attach annotation labels that were chosen in a Largo session.
     *
     * @param \Biigle\User $user
     * @param array $changed
     */
    protected function applyChangedLabels($user, $changed)
    {
        // Skip the rest if no annotations have been changed.
        // The alreadyThereQuery below would FETCH ALL annotation labels if $changed were
        // empty! This almost certainly results in memory exhaustion.
        if (empty($changed)) {
            return;
        }

        // Get all labels that are already there exactly like they should be created
        // in the next step.
        $alreadyThere = ImageAnnotationLabel::select('annotation_id', 'label_id')
            ->where('user_id', $user->id)
            ->where(function ($query) use ($changed) {
                foreach ($changed as $labelId => $annotationIds) {
                    $query->orWhere(function ($query) use ($labelId, $annotationIds) {
                        $query->where('label_id', $labelId)
                            ->whereIn('annotation_id', $annotationIds);
                    });
                }
            })
            ->get();

        $annotationIds = array_unique(array_merge(...$changed));
        $existingAnnotations = ImageAnnotation::whereIn('id', $annotationIds)
            ->pluck('id')
            ->toArray();

        $newAnnotationLabels = [];
        $now = Carbon::now();

        foreach ($changed as $labelId => $annotationIds) {
            foreach ($annotationIds as $annotationId) {
                // Skip all new annotation labels if their annotation no longer exists
                // or if they already exist exactly like they should be created.
                $skip = !in_array($annotationId, $existingAnnotations) ||
                    $alreadyThere->where('annotation_id', $annotationId)
                        ->where('label_id', $labelId)
                        ->isNotEmpty();

                if (!$skip) {
                    $newAnnotationLabels[] = [
                        'annotation_id' => $annotationId,
                        'label_id' => $labelId,
                        'user_id' => $user->id,
                        'confidence' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    // Add the new annotation label to the list so any subsequent equal
                    // annotation label is skipped.
                    $alreadyThere->push([
                        'annotation_id' => $annotationId,
                        'label_id' => $labelId,
                    ]);
                }
            }
        }

        ImageAnnotationLabel::insert($newAnnotationLabels);
    }

    /**
     * Delete annotations that now have no more labels attached.
     *
     * @param array $dismissed [description]
     * @param array $changed [description]
     */
    protected function deleteDanglingAnnotations($dismissed, $changed)
    {
        if (!empty($dismissed)) {
            $dismissed = array_merge(...$dismissed);
        }

        if (!empty($changed)) {
            $changed = array_merge(...$changed);
        }

        $affected = array_values(array_unique(array_merge($dismissed, $changed)));

        $toDeleteQuery = ImageAnnotation::whereIn('image_annotations.id', $affected)
            ->whereDoesntHave('labels');

        $toDeleteArgs = $toDeleteQuery->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->pluck('images.uuid', 'image_annotations.id')
            ->toArray();

        if (!empty($toDeleteArgs)) {
            $toDeleteQuery->delete();
            // The annotation model observer does not fire for this query so we
            // dispatch the remove patch job manually here.
            RemoveAnnotationPatches::dispatch($toDeleteArgs);
        }
    }
}
