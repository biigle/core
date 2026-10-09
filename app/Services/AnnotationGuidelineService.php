<?php

namespace Biigle\Services;

use Biigle\AnnotationGuideline;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Database\Eloquent\Collection;

/**
 * The lookups are memoized per service instance with once() and not stored in the
 * (array) cache because the cache is kept across jobs in queue workers and the values
 * could get stale.
 */
class AnnotationGuidelineService
{
    /**
     * Get the guidelines (enforced and informational) of the projects that the user and
     * the volume have in common.
     *
     * Each guideline has the additional attribute `can_annotate` (whether the user can
     * create annotations in the project of the guideline). Guidelines that are enforced
     * and where `can_annotate` is true can be chosen for new annotations.
     *
     * @return Collection<int, AnnotationGuideline>
     */
    public function getGuidelines(User $user, int $volumeId): Collection
    {
        return once(function () use ($user, $volumeId) {
            $editRoles = $this->getEditRoles();

            return AnnotationGuideline::whereIn(
                'project_id',
                Project::inCommon($user, $volumeId)->select('id')
            )
                ->addSelect([
                    'project_role_id' => DB::table('project_user')
                        ->select('project_role_id')
                        ->whereColumn('project_id', 'annotation_guidelines.project_id')
                        ->where('user_id', $user->id),
                ])
                ->get()
                ->each(function (AnnotationGuideline $guideline) use ($editRoles) {
                    $guideline->can_annotate = in_array($guideline->project_role_id, $editRoles);
                    unset($guideline->project_role_id);
                });
        });
    }

    /**
     * Determine if the user must choose an enforced guideline to create annotations for
     * the volume. This is the case if all projects that the user and the volume have in
     * common (where the user can create annotations) have an enforced guideline.
     */
    public function mustUseGuideline(User $user, int $volumeId): bool
    {
        return once(function () use ($user, $volumeId) {
            $query = Project::inCommon($user, $volumeId, $this->getEditRoles());

            // Without this check, users who can't create annotations (e.g. guests)
            // would be required to use a guideline.
            if (!$query->clone()->exists()) {
                return false;
            }

            return !$query->whereDoesntHave(
                'annotationGuideline',
                fn ($query) => $query->where('enforced', true)
            )
                ->exists();
        });
    }

    /**
     * Global admins get no exception here because they need a project role to create
     * annotations, too.
     *
     * @return array<int>
     */
    protected function getEditRoles(): array
    {
        return [Role::editorId(), Role::expertId(), Role::adminId()];
    }
}
