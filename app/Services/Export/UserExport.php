<?php

namespace Biigle\Services\Export;

use Biigle\User;

class UserExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $users = User::whereIn('id', $this->ids)->get();
        $users->each(function ($user) {
            $user->makeVisible(['password', 'uuid']);
            // The role should not be exported. All imported users should become editors
            // by default.
            $user->makeHidden(['role_id',  'created_at', 'updated_at', 'login_at', 'attrs']);
            $user->append('settings');
        });

        return $users->toArray();
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'users.json';
    }
}
