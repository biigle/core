<?php

namespace Biigle\Modules\Sync\Support\Import;

class UserImport extends Import
{
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
            return $this->expectKeysInJson("{$this->path}/{$basename}", [
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
}
