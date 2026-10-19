<?php

namespace Biigle\Policies;

use Biigle\ExportFile;
use Biigle\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExportFilePolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the export can be accessed by the user.
     */
    public function access(User $user, ExportFile $export): bool
    {
        return $export->user_id === $user->id;
    }

    /**
     * Determine if the export can be deleted by the user.
     */
    public function destroy(User $user, ExportFile $export): bool
    {
        return $export->user_id === $user->id;
    }
}
