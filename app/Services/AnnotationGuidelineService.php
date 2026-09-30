<?php

namespace Biigle\Services;

use Biigle\AnnotationGuideline;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
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
     * @param bool $editable Only include projects where the user can create annotations.
     * The enforced guidelines of these projects can be chosen for new annotations.
     *
     * @return Collection<int, AnnotationGuideline>
     */
    public function getGuidelines(User $user, int $volumeId, bool $editable = false): Collection
    {
        return once(fn () => AnnotationGuideline::whereIn(
            'project_id',
            Project::inCommon($user, $volumeId, $editable ? $this->getEditRoles() : null)
                ->select('id')
        )->get());
    }

    /**
     * Determine if the user must choose an enforced guideline to create annotations for
     * the volume. This is the case if all projects that the user and the volume have in
     * common (where the user can create annotations) have an enforced guideline.
     */
    public function mustUseGuideline(User $user, int $volumeId): bool
    {
        return once(fn () => !Project::inCommon($user, $volumeId, $this->getEditRoles())
            ->whereDoesntHave(
                'annotationGuideline',
                fn ($query) => $query->where('enforced', true)
            )
            ->exists());
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
