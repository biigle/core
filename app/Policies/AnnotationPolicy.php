<?php

namespace Biigle\Policies;

use Biigle\Annotation;
use Biigle\Label;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use Biigle\Volume;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationPolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks.
     *
     * @param User $user
     * @param string $ability
     * @return bool|void
     */
    public function before($user, $ability)
    {
        $only = ['access'];

        if ($user->can('sudo') && in_array($ability, $only)) {
            return true;
        }
    }

    /**
     * Determine if the user may access the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function access(User $user, Annotation $annotation)
    {
        $table = $this->getFileModelTableName($annotation);

        return $this->remember("{$table}-annotation-can-access-{$user->id}-{$annotation->id}", function () use ($user, $annotation, $table) {
            $volume = Volume::select('volumes.id')
                ->join($table, "{$table}.volume_id", '=', 'volumes.id')
                ->where("{$table}.id", $annotation->file_id)
                ->first();

            $session = $volume->getActiveAnnotationSession($user);
            $sessionAccess = !$session || $session->allowsAccess($annotation, $user);

            return $sessionAccess && Project::inCommon($user, $volume->id)->exists();
        });
    }

    /**
     * Determine if the user may update the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function update(User $user, Annotation $annotation)
    {
        $table = $this->getFileModelTableName($annotation);

        return $this->remember("{$table}-annotation-can-update-{$user->id}-{$annotation->id}", function () use ($user, $annotation, $table) {
            // user must be member of one of the projects, the annotation belongs to
            return DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($annotation, $table) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join($table, 'project_volume.volume_id', '=', "{$table}.volume_id")
                        ->where("{$table}.id", $annotation->file_id);
                })
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->exists();
        });
    }

    /**
     * Determine if the user can attach the given label to the given annotation.
     *
     * The annototation (image) must belong to a project where the user is an editor or
     * admin. The label must belong to a label tree that is used by one of the projects
     * the user and the annotation belong to.
     *
     * @param  User  $user
     * @param  Annotation  $annotation
     * @param  Label  $label
     * @return bool
     */
    public function attachLabel(User $user, Annotation $annotation, Label $label)
    {
        $table = $this->getFileModelTableName($annotation);

        return $this->remember("{$table}-annotation-can-attach-label-{$user->id}-{$annotation->id}-{$label->id}", function () use ($user, $annotation, $label, $table) {
            // Projects, the annotation belongs to *and* the user is editor, expert or admin of.
            $projectIds = DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($annotation, $table) {
                    // the projects, the annotation belongs to
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join($table, 'project_volume.volume_id', '=', "{$table}.volume_id")
                        ->where("{$table}.id", $annotation->file_id);
                })
                ->whereIn('project_role_id', [
                    Role::editorId(),
                    Role::expertId(),
                    Role::adminId(),
                ])
                ->pluck('project_id');

            // User must be editor, expert or admin in one of the projects.
            return $projectIds->isNotEmpty()
                // Label must belong to a label tree that is used by one of the projects.
                && DB::table('label_tree_project')
                    ->whereIn('project_id', $projectIds)
                    ->where('label_tree_id', $label->label_tree_id)
                    ->exists();
        });
    }

    /**
     * Determine if the user may delete the given annotation.
     *
     * @param User $user
     * @param Annotation $annotation
     * @return bool
     */
    public function destroy(User $user, Annotation $annotation)
    {
        $table = $this->getFileModelTableName($annotation);

        return $this->remember("{$table}-annotation-can-destroy-{$user->id}-{$annotation->id}", function () use ($user, $annotation, $table) {
            // selects the IDs of the projects, the annotation belongs to
            $projectIdsQuery = function ($query) use ($annotation, $table) {
                $query->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join($table, 'project_volume.volume_id', '=', "{$table}.volume_id")
                    ->where("{$table}.id", $annotation->file_id);
            };

            // check if there are labels of other users attached to this annotation
            // this also handles the case correctly when *no* label is attached
            $hasLabelsFromOthers = $annotation->labels()
                ->where('user_id', '!=', $user->id)
                ->exists();

            if ($hasLabelsFromOthers) {
                // Experts and admins may delete annotations where labels of other users
                // are still attached to.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                    ->exists();
            } else {
                // Editors may delete only those annotations that have their own label
                // attached as only label.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [
                        Role::editorId(),
                        Role::expertId(),
                        Role::adminId(),
                    ])
                    ->exists();
            }
        });
    }

    /**
     * Get the file model table name of the annotation.
     *
     * @param Annotation $annotation
     * @return string
     */
    protected function getFileModelTableName(Annotation $annotation)
    {
        return $annotation->file()->getRelated()->getTable();
    }
}
