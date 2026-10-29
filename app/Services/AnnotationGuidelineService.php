<?php

namespace Biigle\Services;

use Biigle\AnnotationGuideline;
use Biigle\Enums\Role;
use Biigle\Project;
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
     * the volume have in common and where the user can create annotations.
     *
     * Guidelines of projects where the user can't create annotations (e.g. as guest) are
     * omitted because they can't be used and their labels may not be available to the
     * user.
     *
     * @return Collection<int, AnnotationGuideline>
     */
    public function getGuidelines(User $user, int $volumeId): Collection
    {
        return once(fn () => AnnotationGuideline::whereIn(
            'project_id',
            Project::inCommon($user, $volumeId, $this->getEditRoles())->select('id')
        )->get());
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
     * @return array<Role>
     */
    protected function getEditRoles(): array
    {
        return [Role::EDITOR, Role::EXPERT, Role::ADMIN];
    }
}
