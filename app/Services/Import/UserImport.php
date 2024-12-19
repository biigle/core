<?php

namespace Biigle\Services\Import;

use Biigle\Role;
use Biigle\User;
use Carbon\Carbon;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class UserImport extends Import
{
    /**
     * Caches the decoded user import file.
     *
     * @var Illuminate\Support\Collection
     */
    protected $importUsers;

    /**
     * Perform the import.
     *
     * @param array|null $only IDs of the import candidates to limit the import to.
     * @throws UnprocessableEntityHttpException If there are conflicts with the users that should be imported.
     * @return array Maps external user IDs (from the import file) to user IDs of the database.
     */
    public function perform(array $only = null)
    {
        $users = $this->getImportUsers();
        $now = Carbon::now();
        $candidates = $this->getUserImportCandidates()
            ->when(is_array($only), function ($collection) use ($only) {
                return $collection->whereIn('id', $only);
            });

        $conflicts = $candidates->whereIn('id', $this->getConflicts()->pluck('id'));
        if ($conflicts->isNotEmpty()) {
            $users = $conflicts->map(function ($user) {
                return "{$user['firstname']} {$user['lastname']} ({$user['email']})";
            })->implode(', ');

            throw new UnprocessableEntityHttpException("Import cannot be performed. The following users exist according to their email address but the UUIDs do not match: {$users}.");
        }

        $insert = $candidates->map(function ($u) use ($now) {
            unset($u['id']);
            $u['role_id'] = Role::editorId();
            $u['attrs'] = json_encode(['settings' => $u['settings']]);
            unset($u['settings']);
            $u['updated_at'] = $now;
            $u['created_at'] = $now;

            return $u;
        });

        User::insert($insert->toArray());

        $ids = User::whereIn('uuid', $users->pluck('uuid'))->pluck('id', 'uuid');
        $map = [];

        foreach ($users as $user) {
            if ($ids->has($user['uuid'])) {
                $map[$user['id']] = $ids[$user['uuid']];
            }
        }

        return $map;
    }

    /**
     * Get the contents of the user import file.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getImportUsers()
    {
        if (!$this->importUsers) {
            $this->importUsers = $this->collectJson('users.json');
        }

        return $this->importUsers;
    }

    /**
     * Get users that can be imported.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getUserImportCandidates()
    {
        $users = $this->getImportUsers();
        $existing = User::whereIn('uuid', $users->pluck('uuid'))->pluck('uuid');

        // Use values() to discard the original keys.
        return $users->whereNotIn('uuid', $existing)->values();
    }

    /**
     * {@inheritdoc}
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
            return $this->expectKeysInJson('users.json', [
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
     * Get import users whose email address matches with an existing user but the UUID doesn't.
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getConflicts()
    {
        $users = $this->getImportUsers();
        $existing = User::whereIn('email', $users->pluck('email'))->pluck('uuid', 'email');

        return $users->filter(function ($user) use ($existing) {
            return $existing->has($user['email']) && $user['uuid'] !== $existing->get($user['email']);
        });
    }
}
