<?php

namespace Biigle\Policies;

use Biigle\Role;
use Biigle\User;
use Biigle\VolumeFileLabel;
use DB;
use Illuminate\Auth\Access\HandlesAuthorization;

class VolumeFileLabelPolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can delete the given image label.
     *
     * If the user created the image label, they must be editor or admin of one
     * of the projects, the image belongs to. If another user created it, they must
     * be admin of one of the projects.
     *
     * @param  User  $user
     * @param  VolumeFileLabel  $fileLabel
     * @return bool
     */
    public function destroy(User $user, VolumeFileLabel $fileLabel)
    {
        $table = $fileLabel->getTable();
        return $this->remember("{$table}-can-destroy-{$user->id}-{$fileLabel->id}", function () use ($user, $fileLabel) {
            // selects the IDs of the projects, the image belongs to
            $projectIdsQuery = function ($query) use ($fileLabel) {
                $fileModel = $fileLabel->file()->getRelated();
                $fileTable = $fileModel->getTable();
                $query
                    ->select('project_volume.project_id')
                    ->from('project_volume')
                    ->join($fileTable, 'project_volume.volume_id', '=', $fileModel->volume()->getQualifiedForeignKeyName())
                    ->where("{$fileTable}.id", $fileLabel->file_id);
            };

            if ($fileLabel->user_id === $user->id) {
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
}
