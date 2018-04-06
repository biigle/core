<?php

namespace Biigle\Modules\Sync\Support\Import;

class LabelTreeImport extends Import
{
    /**
     * @{inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'users.json',
            'label_trees.json',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        switch ($basename) {
            case 'users.json':
                return (new UserImport($this->path))->validateFile($basename);

            case 'label_trees.json':
                return $this->expectKeysInJson("{$this->path}/label_trees.json", [
                    'id',
                    'name',
                    'description',
                    'labels',
                    'members',
                    'uuid',
                ]);
        }

        return parent::validateFile($basename);
    }
}
