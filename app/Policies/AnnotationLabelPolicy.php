<?php

namespace Biigle\Policies;

use Biigle\AnnotationLabel;
use Biigle\Role;
use Biigle\User;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnotationLabelPolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can edit the given annotation label.
     *
     * If the user created the annotation label, they must be editor or admin of one
     * of the projects, the annotation belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  AnnotationLabel  $annotationLabel
     * @return bool
     */
    public function update(User $user, AnnotationLabel $annotationLabel)
    {
        $model = $annotationLabel->annotation()->getRelated();
        $fileTable = $model->file()->getRelated()->getTable();

        return $this->remember("{$fileTable}-annotation-label-can-update-{$user->id}-{$annotationLabel->id}", function () use ($user, $annotationLabel, $fileTable, $model) {
            $projectIdsQuery = function ($query) use ($annotationLabel, $fileTable, $model) {
                $annotationsTable = $model->getTable();
                $foreignKeyName = $model->file()->getQualifiedForeignKeyName();
                $query
                    ->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join($fileTable, 'project_volume.volume_id', '=', "{$fileTable}.volume_id")
                    ->join($annotationsTable, $foreignKeyName, '=', "{$fileTable}.id")
                    ->where("{$annotationsTable}.id", $annotationLabel->annotation_id);
            };

            if ($annotationLabel->user_id === $user->id) {
                // Editors, experts and admins may detach their own labels.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [
                        Role::editorId(),
                        Role::expertId(),
                        Role::adminId(),
                    ])
                    ->exists();
            } else {
                // Experts and admins may detach labels other than their own.
                return DB::table('project_user')
                    ->where('user_id', $user->id)
                    ->whereIn('project_id', $projectIdsQuery)
                    ->whereIn('project_role_id', [Role::expertId(), Role::adminId()])
                    ->exists();
            }
        });
    }

    /**
     * Determine if the user can delete the given annotation label.
     *
     * If the user created the annotation label, they must be editor or admin of one
     * of the projects, the annotation belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  AnnotationLabel  $annotationLabel
     * @return bool
     */
    public function destroy(User $user, AnnotationLabel $annotationLabel)
    {
        return $this->update($user, $annotationLabel);
    }
}
