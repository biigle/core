<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api;

use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;

class LargoController extends Controller
{
    /**
     * Validates the input for saving an Largo session.
     *
     * @param Request $request
     */
    protected function validateLargoInput(Request $request)
    {
        $this->validate($request, [
            'dismissed' => 'array',
            'changed' => 'array',
            'force' => 'bool',
        ]);
    }

    /**
     * Get a list of unique annotation IDs that are either dismissed or changed.
     *
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of all changed annotation IDs for each label
     *
     * @return array
     */
    protected function getAffectedAnnotations($dismissed, $changed)
    {
        if (!empty($dismissed)) {
            $dismissed = array_merge(...$dismissed);
        }

        if (!empty($changed)) {
            $changed = array_merge(...$changed);
        }

        return array_values(array_unique(array_merge($dismissed, $changed)));
    }

    /**
     * Check if all given annotations belong to the given volumes.
     *
     * @param array $annotations Annotation IDs
     * @param array $volumes Volume IDs
     *
     * @return bool
     */
    protected function anotationsBelongToVolumes($annotations, $volumes)
    {
        return !Annotation::join('images', 'annotations.image_id', '=', 'images.id')
            ->whereIn('annotations.id', $annotations)
            ->whereNotIn('images.volume_id', $volumes)
            ->exists();
    }

    /**
     * Returns the IDs of all label trees that must be available to apply the changes.
     *
     * @param array $changed Array of all changed annotation IDs for each label
     *
     * @return array
     */
    protected function getRequiredLabelTrees($changed)
    {
        return Label::whereIn('id', array_keys($changed))
            ->groupBy('label_tree_id')
            ->pluck('label_tree_id');
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

        return compact('dismissed', 'changed');
    }

    /**
     * Apply the changes of an Largo session.
     *
     * Removes the dismissed annotation labels and creates the changed annotation labels.
     *
     * @param \Biigle\User $user
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of all changed annotation IDs for each label
     * @param bool $force Dismiss labels even if they were created by other users
     */
    protected function applySave($user, $dismissed, $changed, $force = false)
    {
        $filtered = $this->ignoreDeletedLabels($dismissed, $changed);

        // Roll back changes if any errors occur.
        DB::transaction(function () use ($user, $filtered, $force) {
            $this->applyDismissedLabels($user, $filtered['dismissed'], $force);
            $this->applyChangedLabels($user, $filtered['changed']);
        });
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
            AnnotationLabel::whereIn('annotation_id', $annotationIds)
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
        $alreadyThere = AnnotationLabel::select('annotation_id', 'label_id')
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
        $existingAnnotations = Annotation::whereIn('id', $annotationIds)
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

        AnnotationLabel::insert($newAnnotationLabels);
    }
}
