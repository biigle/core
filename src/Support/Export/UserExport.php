<?php

namespace Biigle\Modules\Sync\Support\Export;

use Biigle\User;

class UserExport extends Export
{
    /**
     * IDs of the users of this export.
     *
     * @var array
     */
    protected $ids;

    /**
     * Create a new instance.
     *
     * @param array $ids User IDs
     */
    function __construct($ids)
    {
        $this->ids = $ids;
    }

    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $users = User::whereIn('id', $this->ids)->get();
        $users->each(function ($user) {
            $user->makeVisible(['password', 'uuid']);
            // The role should not be exported. All imported users should become edotirs
            // by default.
            $user->makeHidden(['role_id',  'created_at', 'updated_at', 'login_at']);
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
