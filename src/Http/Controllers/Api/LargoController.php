<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api;

use DB;
use Biigle\Label;
use Carbon\Carbon;
use Biigle\Annotation;
use Biigle\AnnotationLabel;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

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
        ]);
    }

    /**
     * Get a list of unique annotation IDs that are either dismissed or changed.
     *
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of IDs of changed annotations
     *
     * @return array
     */
    protected function getAffectedAnnotations($dismissed, $changed)
    {
        $affectedAnnotations = array_reduce($dismissed, function ($carry, $item) {
            return array_merge($carry, $item);
        }, []);

        return array_unique(array_merge($affectedAnnotations, array_keys($changed)));
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
     * @param array $changed Array of IDs of changed annotations
     *
     * @return array
     */
    protected function getRequiredLabelTrees($changed)
    {
        return Label::whereIn('id', array_unique(array_values($changed)))
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
        $existingIds = Label::whereIn('id', array_values($changed))->pluck('id');

        // Get IDs of annotations to which a label should be attached that no longer
        // exists.
        $toIgnore = array_keys(array_filter($changed, function ($id) use ($existingIds) {
            return !$existingIds->contains($id);
        }));

        // Remove all annotations from the dismissed array that should be ignored.
        // Use outermost array_filter to remove now empty elements.
        $dismissed = array_filter(array_map(function ($ids) use ($toIgnore) {
            return array_filter($ids, function ($id) use ($toIgnore) {
                return !in_array($id, $toIgnore);
            });
        }, $dismissed));

        // Remove all annotations from the changed array that should be ignored.
        $changed = array_filter($changed, function ($id) use ($toIgnore) {
            return !in_array($id, $toIgnore);
        }, ARRAY_FILTER_USE_KEY);

        return compact('dismissed', 'changed');
    }

    /**
     * Apply the changes of an Largo session.
     *
     * Removes the dismissed annotation labels and creates the changed annotation labels.
     *
     * @param \Biigle\User $user
     * @param array $dismissed Array of all dismissed annotation IDs for each label
     * @param array $changed Array of IDs of changed annotations
     */
    protected function applySave($user, $dismissed, $changed)
    {
        $filtered = $this->ignoreDeletedLabels($dismissed, $changed);

        // Roll back changes if any errors occur.
        DB::transaction(function () use ($user, $filtered) {
            $this->applyDismissedLabels($user, $filtered['dismissed']);
            $this->applyChangedLabels($user, $filtered['changed']);
        });
    }

    /**
     * Detach annotation labels that were dismissed in a Largo session.
     *
     * @param \Biigle\User $user
     * @param array $dismissed
     */
    protected function applyDismissedLabels($user, $dismissed)
    {
        foreach ($dismissed as $labelId => $annotationIds) {
            AnnotationLabel::whereIn('annotation_id', $annotationIds)
                ->where('label_id', $labelId)
                ->where('user_id', $user->id)
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
        if (count($changed) === 0) {
            return;
        }

        // Get all labels that are already there exactly like they should be created
        // in the next step.
        $alreadyThere = AnnotationLabel::select('annotation_id', 'label_id')
            ->where('user_id', $user->id)
            ->where(function ($query) use ($changed) {
                foreach ($changed as $annotationId => $labelId) {
                    $query->orWhere(function ($query) use ($annotationId, $labelId) {
                        $query->where('annotation_id', $annotationId)
                            ->where('label_id', $labelId);
                    });
                }
            })
            ->get();

        $existingAnnotations = Annotation::whereIn('id', array_keys($changed))
            ->pluck('id')
            ->toArray();

        $newAnnotationLabels = [];
        $now = Carbon::now();

        foreach ($changed as $annotationId => $labelId) {
            // Skip all new annotation labels if their annotation no longer exists
            // or if they already exist exactly like they should be created.
            $skip = !in_array($annotationId, $existingAnnotations) ||
                !$alreadyThere->where('annotation_id', $annotationId)
                    ->where('label_id', $labelId)
                    ->isEmpty();

            if (!$skip) {
                $newAnnotationLabels[] = [
                    'annotation_id' => $annotationId,
                    'label_id' => $labelId,
                    'user_id' => $user->id,
                    'confidence' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

        }

        AnnotationLabel::insert($newAnnotationLabels);
    }
}
