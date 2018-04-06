<?php

namespace Biigle\Modules\Sync\Support\Import;

use File;
use Biigle\User;
use Biigle\Role;
use Carbon\Carbon;

class UserImport extends Import
{
    /**
     * Caches the decoded user import file.
     *
     * @var Illuminate\Support\Collection
     */
    protected $importUsers;

    /**
     * Perform the import
     *
     * @return array Maps external user IDs (from the import file) to user IDs of the database.
     */
    public function import()
    {
        $users = $this->getImportUsers();
        $now = Carbon::now();
        $insert = $this->getUserImportCandidates()->map(function ($u) use ($now) {
            unset($u['id']);
            $u['role_id'] = Role::$editor->id;
            $u['settings'] = json_encode($u['settings']);
            $u['updated_at'] = $now;
            $u['created_at'] = $now;

            return $u;
        });
        User::insert($insert->toArray());

        $ids = User::whereIn('uuid', $users->pluck('uuid'))->pluck('id', 'uuid');
        $map = [];

        foreach ($users as $user) {
            $map[$user['id']] = $ids[$user['uuid']];
        }

        return $map;
    }

    /**
     * Get IDs, firstnames and lastnames of users that can be imported.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getUserImportCandidates()
    {
        $users = $this->getImportUsers();
        $existing = User::whereIn('uuid', $users->pluck('uuid'))->pluck('uuid');

        return $users->whereNotIn('uuid', $existing);
    }

    /**
     * @{inheritdoc}
     */
    protected function expectedFiles()
    {
        return ['users.json'];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        if ($basename === 'users.json') {
            return $this->expectKeysInJson("{$this->path}/users.json", [
                'id',
                'firstname',
                'lastname',
                'password',
                'email',
                'settings',
                'uuid',
            ]);
        }

        return parent::validateFile($basename);
    }

    /**
     * Get the contents of the user import file.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getImportUsers()
    {
        if (!$this->importUsers) {
            $this->importUsers = collect(json_decode(File::get("{$this->path}/users.json"), true));
        }

        return $this->importUsers;
    }
}
