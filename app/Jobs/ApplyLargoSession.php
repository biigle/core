<?php

namespace Biigle\Jobs;

use Biigle\AnnotationGuideline;
use Biigle\Events\LargoSessionFailed;
use Biigle\Events\LargoSessionSaved;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Label;
use Biigle\User;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\Volume;
use Cache;
use Carbon\Carbon;
use DB;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Log;
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
     * Number of seconds to keep the IDs of unchanged annotations in the cache.
     *
     * @var integer
     */
    const UNCHANGED_CACHE_TTL = 3600;

    /**
     * The enforced annotation guideline that applies to the changed annotations.
     */
    protected ?AnnotationGuideline $guideline = null;

    /**
     * IDs of image annotations that were not changed.
     */
    protected array $unchangedImageAnnotations = [];

    /**
     * IDs of video annotations that were not changed.
     */
    protected array $unchangedVideoAnnotations = [];

    /**
     * Whether changes were rejected because of the annotation guideline.
     */
    protected bool $rejectedByGuideline = false;

    /**
     * Whether labels of other users were not dismissed.
     */
    protected bool $rejectedOtherUser = false;

    /**
     * Get the cache key for the IDs of the unchanged annotations of a Largo session.
     */
    public static function getUnchangedCacheKey(string $id): string
    {
        return "largo-session-{$id}-unchanged";
    }

    /**
     * Create a new job instance.
     *
     * @param string $id The job ID.
     * @param User $user The user who submitted the Largo session.
     * @param array $dismissedImageAnnotations Array of all dismissed image annotation IDs for each label.
     * @param array $changedImageAnnotations Array of all changed image annotation IDs for each label.
     * @param array $dismissedVideoAnnotations Array of all dismissed video annotation IDs for each label.
     * @param array $changedVideoAnnotations Array of all changed video annotation IDs for each label.
     * @param bool $force Whether to dismiss labels even if they were created by other users.
     * @param int|null $guidelineId ID of the enforced annotation guideline that applies to the changed annotations.
     */
    public function __construct(
        public string $id,
        public User $user,
        public array $dismissedImageAnnotations,
        public array $changedImageAnnotations,
        public array $dismissedVideoAnnotations,
        public array $changedVideoAnnotations,
        public bool $force,
        public ?int $guidelineId = null
    ) {
        $this->queue = config('largo.apply_session_queue');
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

        if (!is_null($this->guidelineId)) {
            // If the guideline was deleted or is no longer enforced in the meantime,
            // nothing is restricted.
            $this->guideline = AnnotationGuideline::where('enforced', true)->find($this->guidelineId);
        }

        DB::transaction(function () {
            $this->handleImageAnnotations();
            $this->handleVideoAnnotations();
        });

        $this->cleanupJobId();

        try {
            $hasUnchanged = $this->storeUnchangedAnnotations();
        } catch (Throwable $e) {
            // The changes are already committed so the job must not fail here.
            Log::warning("Could not store unchanged annotations of Largo session {$this->id}: {$e->getMessage()}");
            $hasUnchanged = false;
        }

        LargoSessionSaved::dispatch($this->id, $this->user, $hasUnchanged);
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

        [$dismissed, $changed, $rejected] = $this->ignoreGuidelineViolations($dismissed, $changed, ImageAnnotation::class);
        $kept = $this->getKeptAnnotations($dismissed, $changed, ImageAnnotationLabel::class);
        $this->unchangedImageAnnotations = $this->collectUnchanged($rejected, $kept);

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

        [$dismissed, $changed, $rejected] = $this->ignoreGuidelineViolations($dismissed, $changed, VideoAnnotation::class);
        $kept = $this->getKeptAnnotations($dismissed, $changed, VideoAnnotationLabel::class);
        $this->unchangedVideoAnnotations = $this->collectUnchanged($rejected, $kept);

        // Change labels first, then dismiss to keep the opportunity to copy feature
        // vectors. If labels are deleted first, the feature vectors will be immediately
        // deleted, too, and nothing can be copied any more.
        $this->applyChangedLabels($this->user, $changed, VideoAnnotation::class, VideoAnnotationLabel::class);
        $this->applyDismissedLabels($this->user, $dismissed, $this->force, VideoAnnotationLabel::class);
        $this->deleteDanglingAnnotations($dismissed, $changed, VideoAnnotation::class);
    }

    /**
     * Removes all changes and dismissals of annotations where a change is not allowed
     * by the annotation guideline. The API does not tell which dismissed label is
     * replaced by which changed label, so the whole annotation must be skipped.
     * Otherwise an annotation could lose its old label without getting a new one and
     * would be deleted as dangling annotation.
     *
     * @return array Containing 'dismissed', 'changed' and the IDs of the rejected annotations.
     */
    protected function ignoreGuidelineViolations(array $dismissed, array $changed, string $annotationModel): array
    {
        if (is_null($this->guideline) || empty($changed)) {
            return [$dismissed, $changed, []];
        }

        $rejected = [];
        // Annotations that require a shape check, grouped by the allowed shapes so
        // labels with the same allowed shapes need only one check.
        $shapeChecks = [];

        foreach ($changed as $labelId => $annotationIds) {
            if (!$this->guideline->allowsLabel($labelId)) {
                $rejected[] = $annotationIds;
                continue;
            }

            $shapeIds = $this->guideline->allowedShapes($labelId);
            if (is_null($shapeIds)) {
                continue;
            }

            sort($shapeIds);
            $key = implode(',', $shapeIds);
            $shapeChecks[$key]['shapeIds'] = $shapeIds;
            $shapeChecks[$key]['annotationIds'][] = $annotationIds;
        }

        foreach ($shapeChecks as $check) {
            $annotationIds = array_values(array_unique(array_merge(...$check['annotationIds'])));
            $rejected[] = $this->getAnnotationsWithOtherShapes(
                $annotationIds,
                $check['shapeIds'],
                $annotationModel
            );
        }

        $rejected = array_values(array_unique(array_merge(...$rejected)));

        if (empty($rejected)) {
            return [$dismissed, $changed, []];
        }

        $rejectedLookup = array_flip($rejected);
        $filter = fn ($ids) => array_values(array_filter($ids, fn ($id) => !isset($rejectedLookup[$id])));
        // Use outermost array_filter to remove now empty elements.
        $dismissed = array_filter(array_map($filter, $dismissed));
        $changed = array_filter(array_map($filter, $changed));

        return [$dismissed, $changed, $rejected];
    }

    /**
     * Get the IDs of the annotations that have a shape other than the given shapes.
     */
    protected function getAnnotationsWithOtherShapes(array $annotationIds, array $shapeIds, string $annotationModel): array
    {
        $chunkSize = config('biigle.db_param_limit') - count($shapeIds);
        $ids = [];

        foreach (array_chunk($annotationIds, $chunkSize) as $chunk) {
            $ids[] = $annotationModel::whereIn('id', $chunk)
                ->whereNotIn('shape_id', $shapeIds)
                ->pluck('id')
                ->all();
        }

        return array_merge(...$ids);
    }

    /**
     * Merge the IDs of the annotations that were not changed.
     *
     * @param array $rejected IDs of annotations rejected by the annotation guideline.
     * @param array $kept IDs of annotations that were not deleted because labels of other users were not detached.
     */
    protected function collectUnchanged(array $rejected, array $kept): array
    {
        if (!empty($rejected)) {
            $this->rejectedByGuideline = true;
        }

        if (!empty($kept)) {
            $this->rejectedOtherUser = true;
        }

        return array_values(array_unique(array_map('intval', array_merge($rejected, $kept))));
    }

    /**
     * Store the IDs of the unchanged annotations so the user can fetch them.
     *
     * @return bool Whether there are unchanged annotations.
     */
    protected function storeUnchangedAnnotations(): bool
    {
        if (empty($this->unchangedImageAnnotations) && empty($this->unchangedVideoAnnotations)) {
            return false;
        }

        // The IDs are not sent with the broadcast event because the payload size is
        // limited.
        Cache::put(self::getUnchangedCacheKey($this->id), [
            'user_id' => $this->user->id,
            'image_annotations' => $this->unchangedImageAnnotations,
            'video_annotations' => $this->unchangedVideoAnnotations,
            'guideline' => $this->rejectedByGuideline,
            'other_user' => $this->rejectedOtherUser,
        ], self::UNCHANGED_CACHE_TTL);

        return true;
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
            $dismissed = array_filter(array_map(fn ($ids) => array_diff($ids, $ignoreAnnotations), $dismissed));
        }

        return [$dismissed, $changed];
    }

    /**
     * Removes changes to annotations where the same label was dismissed that should be
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

                $dismissed[$labelId] = array_filter(
                    $annotationIds,
                    fn ($x) => !in_array($x, $toIgnore)
                );
                $changed[$labelId] = array_filter(
                    $changed[$labelId],
                    fn ($x) => !in_array($x, $toIgnore)
                );
            }
        }

        // Remove elements that may now be emepty.
        $dismissed = array_filter($dismissed);
        $changed = array_filter($changed);

        return [$dismissed, $changed];
    }

    /**
     * Get the IDs of annotations that should be dismissed (without getting a new label)
     * but won't be because the attached label is from another user. This does not
     * include annotations where both the other user and the requesting user have the
     * same label attached because the label of the requesting user *will* be detached.
     */
    protected function getKeptAnnotations(array $dismissed, array $changed, string $labelModel): array
    {
        if ($this->force || empty($dismissed)) {
            return [];
        }

        // Account for additional parameters in the query (label_id and two user_id)
        $chunkSize = config('biigle.db_param_limit') - 3;
        $changedLookup = empty($changed) ? [] : array_flip(array_merge(...$changed));
        $table = (new $labelModel)->getTable();
        $kept = [];

        foreach ($dismissed as $labelId => $annotationIds) {
            $annotationIds = array_filter($annotationIds, fn ($id) => !isset($changedLookup[$id]));

            foreach (array_chunk($annotationIds, $chunkSize) as $chunk) {
                $kept[] = $labelModel::whereIn("{$table}.annotation_id", $chunk)
                    ->where("{$table}.user_id", '!=', $this->user->id)
                    ->where("{$table}.label_id", $labelId)
                    // Only report annotations that were truly kept, i.e. did not have
                    // the same label attached by the requesting user, too.
                    ->whereNotExists(fn ($query) => $query->select(DB::raw(1))
                        ->from("{$table} as own")
                        ->whereColumn('own.annotation_id', "{$table}.annotation_id")
                        ->whereColumn('own.label_id', "{$table}.label_id")
                        ->where('own.user_id', $this->user->id))
                    ->pluck("{$table}.annotation_id")
                    ->all();
            }
        }

        return array_merge(...$kept);
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
        // Account for additional parameters in the query (label_id and user_id)
        $chunkSize = config('biigle.db_param_limit') - 2;

        foreach ($dismissed as $labelId => $annotationIds) {
            $chunks = array_chunk($annotationIds, $chunkSize);
            foreach ($chunks as $chunk) {
                $labelModel::whereIn('annotation_id', $chunk)
                    ->when(!$force, fn ($query) => $query->where('user_id', $user->id))
                    ->where('label_id', $labelId)
                    ->delete();
            }
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

        // Acquire row locks in ascending ID order before deleting. Without this, two
        // concurrent jobs can deadlock: PostgreSQL's FK check on the annotation labels
        // table causes each job's DELETE to wait for the other's insert-transaction,
        // forming a circular lock dependency.
        $toDeleteQuery->clone()->orderBy('id')->lockForUpdate()->pluck('id');

        $toDeleteArgs = $toDeleteQuery->clone()->join($fileTable, $relation->getQualifiedOwnerKeyName(), '=', $relation->getQualifiedForeignKeyName())
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
