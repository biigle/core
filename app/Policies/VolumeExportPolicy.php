<?php

namespace Biigle\Policies;

use Biigle\User;
use Biigle\VolumeExport;
use Illuminate\Auth\Access\HandlesAuthorization;

class VolumeExportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the export can be accessed by the user.
     */
    public function access(User $user, VolumeExport $export): bool
    {
        return $export->user_id === $user->id;
    }

    /**
     * Determine if the export can be deleted by the user.
     */
    public function destroy(User $user, VolumeExport $export): bool
    {
        return $export->user_id === $user->id;
    }
}
