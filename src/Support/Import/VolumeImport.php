<?php

namespace Biigle\Modules\Sync\Support\Import;

class VolumeImport extends Import
{
    /**
     * @{inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'users.json',
            'label_trees.json',
            'volumes.json',
            'images.csv',
            'annotations.csv',
            'annotation_labels.csv',
            'image_labels.csv',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        switch ($basename) {
            case 'users.json':
            case 'label_trees.json':
                return (new LabelTreeImport($this->path))->validateFile($basename);
            case 'volumes.json':
                return $this->expectKeysInJson('volumes.json', [
                    'id',
                    'name',
                    'media_type_id',
                    'url',
                    'attrs',
                ]);
            case 'images.csv':
                return $this->expectColumnsInCsv('images.csv', [
                    'id',
                    'filename',
                    'volume_id',
                ]);
            case 'annotation_labels.csv':
                return $this->expectColumnsInCsv('annotation_labels.csv', [
                    'annotation_id',
                    'label_id',
                    'user_id',
                    'confidence',
                    'created_at',
                    'updated_at',
                ]);
            case 'annotations.csv':
                return $this->expectColumnsInCsv('annotations.csv', [
                    'id',
                    'image_id',
                    'shape_id',
                    'created_at',
                    'updated_at',
                    'points',
                ]);
            case 'image_labels.csv':
                return $this->expectColumnsInCsv('image_labels.csv', [
                    'image_id',
                    'label_id',
                    'user_id',
                    'created_at',
                    'updated_at',
                ]);
        }

        return parent::validateFile($basename);
    }
}
