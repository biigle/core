<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Jobs\Job;
use Biigle\Label;
use Biigle\Modules\Largo\Events\LargoSessionFailed;
use Biigle\Modules\Largo\Events\LargoSessionSaved;
use Biigle\Modules\Largo\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\User;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\Volume;
use Carbon\Carbon;
use DB;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

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
     * Array of all dismissed image annotation IDs for each label.
     *
     * @var array
     */
    public $dismissedImageAnnotations;

    /**
     * Array of all changed image annotation IDs for each label.
     *
     * @var array
     */
    public $changedImageAnnotations;

    /**
     * Array of all dismissed video annotation IDs for each label.
     *
     * @var array
     */
    public $dismissedVideoAnnotations;

    /**
     * Array of all changed video annotation IDs for each label.
     *
     * @var array
     */
    public $changedVideoAnnotations;

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
     * @param array $dismissedImageAnnotations
     * @param array $changedImageAnnotations
     * @param array $dismissedVideoAnnotations
     * @param array $changedVideoAnnotations
     * @param bool $force
     *
     * @return void
     */
    public function __construct($id, User $user, $dismissedImageAnnotations, $changedImageAnnotations, $dismissedVideoAnnotations, $changedVideoAnnotations, $force)
    {
        $this->queue = config('largo.apply_session_queue');
        $this->id = $id;
        $this->user = $user;
        $this->dismissedImageAnnotations = $dismissedImageAnnotations;
        $this->changedImageAnnotations = $changedImageAnnotations;
        $this->dismissedVideoAnnotations = $dismissedVideoAnnotations;
        $this->changedVideoAnnotations = $changedVideoAnnotations;
        $this->force = $force;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if (!Volume::where('attrs->largo_job_id', $this->id)->exists()) {
            // The job previously exited or failed. Don't run it twice.
            // This can happen if the admin reruns failed jobs.
            return;
        }

        DB::transaction(function () {
            $this->handleImageAnnotations();
            $this->handleVideoAnnotations();
        });

        $this->cleanupJobId();
        LargoSessionSaved::dispatch($this->id, $this->user);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        $this->cleanupJobId();
        LargoSessionFailed::dispatch($this->id, $this->user);
    }

    /**
     * Remove the properties that indicate that a save Largo session is in progress.
     */
    protected function cleanupJobId(): void
    {
        Volume::where('attrs->largo_job_id', $this->id)->each(function ($volume) {
            $attrs = $volume->attrs;
            unset($attrs['largo_job_id']);
            $volume->attrs = $attrs;
            $volume->save();
        });
    }

    /**
     * Process the image annotations.
     */
    protected function handleImageAnnotations()
    {
        [$dismissed, $changed] = $this->ignoreDeletedLabels($this->dismissedImageAnnotations, $this->changedImageAnnotations);

        // This is essential, otherwise annotations could be deleted without warning
        // below (because changes are applied first, then labels are dismissed, then
        // dangling annotations are deleted)!
        [$dismissed, $changed] = $this->ignoreNullChanges($dismissed, $changed);

        // Change labels first, then dismiss to keep the opportunity to copy feature
        // vectors. If labels are deleted first, the feature vectors will be immediately
        // deleted, too, and nothing can be copied any more.
        $this->applyChangedLabels($this->user, $changed, ImageAnnotation::class, ImageAnnotationLabel::class);
        $this->applyDismissedLabels($this->user, $dismissed, $this->force, ImageAnnotationLabel::class);
        $this->deleteDanglingAnnotations($dismissed, $changed, ImageAnnotation::class);
    }

    /**
     * Process the video annotations.
     */
    protected function handleVideoAnnotations()
    {
        [$dismissed, $changed] = $this->ignoreDeletedLabels($this->dismissedVideoAnnotations, $this->changedVideoAnnotations);

        // This is essential, otherwise annotations could be deleted without warning
        // below (because changes are applied first, then labels are dismissed, then
        // dangling annotations are deleted)!
        [$dismissed, $changed] = $this->ignoreNullChanges($dismissed, $changed);

        // Change labels first, then dismiss to keep the opportunity to copy feature
        // vectors. If labels are deleted first, the feature vectors will be immediately
        // deleted, too, and nothing can be copied any more.
        $this->applyChangedLabels($this->user, $changed, VideoAnnotation::class, VideoAnnotationLabel::class);
        $this->applyDismissedLabels($this->user, $dismissed, $this->force, VideoAnnotationLabel::class);
        $this->deleteDanglingAnnotations($dismissed, $changed, VideoAnnotation::class);
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
                return array_diff($ids, $ignoreAnnotations);
            }, $dismissed));
        }

        return [$dismissed, $changed];
    }

    /**
     * Removes changes to annotations where the same label was dismissed than should be
     * attached again later.
     */
    protected function ignoreNullChanges(array $dismissed, array $changed): array
    {
        foreach ($dismissed as $labelId => $annotationIds) {
            if (array_key_exists($labelId, $changed)) {
                $toIgnore = [];
                foreach ($annotationIds as $id) {
                    if (array_search($id, $changed[$labelId]) !== false) {
                        $toIgnore[] = $id;
                    }
                }

                $dismissed[$labelId] = array_filter($annotationIds,
                        fn ($x) => !in_array($x, $toIgnore));
                $changed[$labelId] = array_filter($changed[$labelId],
                        fn ($x) => !in_array($x, $toIgnore));
            }
        }

        // Remove elements that may now be emepty.
        $dismissed = array_filter($dismissed);
        $changed = array_filter($changed);

        return [$dismissed, $changed];
    }

    /**
     * Detach annotation labels that were dismissed in a Largo session.
     *
     * @param \Biigle\User $user
     * @param array $dismissed
     * @param bool $force
     * @param string $labelModel The annotation label model class.
     */
    protected function applyDismissedLabels($user, $dismissed, $force, $labelModel)
    {
        foreach ($dismissed as $labelId => $annotationIds) {
            $labelModel::whereIn('annotation_id', $annotationIds)
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
     * @param string $annotationModel The annotation model class.
     * @param string $labelModel The annotation label model class.
     */
    protected function applyChangedLabels($user, $changed, $annotationModel, $labelModel)
    {
        // Skip the rest if no annotations have been changed.
        // The alreadyThereQuery below would FETCH ALL annotation labels if $changed were
        // empty! This almost certainly results in memory exhaustion.
        if (empty($changed)) {
            return;
        }

        // Get all labels that are already there exactly like they should be created
        // in the next step.
        // This is built as a map of annotation ID and label ID pair keys to make the
        // existence check later much faster.
        $alreadyThere = $labelModel::select('annotation_id', 'label_id')
            ->where('user_id', $user->id)
            ->where(function ($query) use ($changed) {
                foreach ($changed as $labelId => $annotationIds) {
                    $query->orWhere(function ($query) use ($labelId, $annotationIds) {
                        $query->where('label_id', $labelId)
                            ->whereIn('annotation_id', $annotationIds);
                    });
                }
            })
            ->get()
            ->map(fn ($label) => "{$label->annotation_id}-{$label->label_id}")
            ->flip()
            ->toArray();

        $annotationIds = array_unique(array_merge(...$changed));
        $existingAnnotations = $annotationModel::whereIn('id', $annotationIds)
            ->pluck('id')
            ->toArray();

        $newAnnotationLabels = [];
        $now = Carbon::now();

        foreach ($changed as $labelId => $annotationIds) {
            // Handle only annotations that still exist.
            $annotationIds = array_intersect($annotationIds, $existingAnnotations);
            foreach ($annotationIds as $annotationId) {
                // Skip new annotation labels if they already exist exactly like they
                // should be created.
                if (!array_key_exists("{$annotationId}-{$labelId}", $alreadyThere)) {
                    $newAnnotationLabels[] = [
                        'annotation_id' => $annotationId,
                        'label_id' => $labelId,
                        'user_id' => $user->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    // Add the new annotation label to the map so any subsequent equal
                    // annotation label is skipped.
                    $alreadyThere["{$annotationId}-{$labelId}"] = true;
                }
            }
        }

        // Free memory.
        unset($alreadyThere);

        // Store the ID so we can efficiently loop over the models later. This is only
        // possible because all this happens inside a DB transaction (see above).
        $startId = $labelModel::orderBy('id', 'desc')->select('id')->first()->id;

        collect($newAnnotationLabels)
            // Chunk for huge requests which may run into the 65535 parameters limit of a
            // single database call.
            // See: https://github.com/biigle/largo/issues/76
            ->chunk(5000)
            ->each(function ($chunk) use ($labelModel) {
                if ($labelModel === ImageAnnotationLabel::class) {
                    $chunk = $chunk->map(function ($item) {
                        $item['confidence'] = 1;

                        return $item;
                    });
                }

                $labelModel::insert($chunk->toArray());
            });

        // Free memory.
        unset($newAnnotationLabels);

        $labelModel::where('id', '>', $startId)
            ->eachById(function ($annotationLabel) use ($labelModel) {
                // Execute the jobs synchronously because after this method the
                // old annotation labels may be deleted and there will be nothing
                // to copy any more.
                if ($labelModel === ImageAnnotationLabel::class) {
                    (new CopyImageAnnotationFeatureVector($annotationLabel))->handle();
                } else {
                    (new CopyVideoAnnotationFeatureVector($annotationLabel))->handle();
                }
            });
    }

    /**
     * Delete annotations that now have no more labels attached.
     *
     * @param array $dismissed
     * @param array $changed
     * @param string $annotationModel The annotation model class.
     */
    protected function deleteDanglingAnnotations($dismissed, $changed, $annotationModel)
    {
        if (!empty($dismissed)) {
            $dismissed = array_merge(...$dismissed);
        }

        if (!empty($changed)) {
            $changed = array_merge(...$changed);
        }

        $affected = array_values(array_unique(array_merge($dismissed, $changed)));

        $relation = (new $annotationModel)->file();
        $fileTable = $relation->getRelated()->getTable();

        $toDeleteQuery = $annotationModel::whereIn($relation->getQualifiedParentKeyName(), $affected)
            ->whereDoesntHave('labels');

        $toDeleteArgs = $toDeleteQuery->join($fileTable, $relation->getQualifiedOwnerKeyName(), '=', $relation->getQualifiedForeignKeyName())
            ->pluck("{$fileTable}.uuid", $relation->getQualifiedParentKeyName())
            ->toArray();

        if (!empty($toDeleteArgs)) {
            $toDeleteQuery->delete();
            // The annotation model observer does not fire for this query so we
            // dispatch the remove patch job manually here.
            if ($annotationModel === ImageAnnotation::class) {
                RemoveImageAnnotationPatches::dispatch($toDeleteArgs);
            } else {
                RemoveVideoAnnotationPatches::dispatch($toDeleteArgs);
            }
        }
    }
}
