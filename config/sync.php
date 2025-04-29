<?php

return [
    /*
    | Directory to store temporary files to
    */
    'tmp_storage' => sys_get_temp_dir(),

    /*
    | Set which exports should be allowed for this instance.
    */
    'allowed_exports' => [
        'volumes',
        'labelTrees',
        'users',
    ],

    /*
    | Storage disk where the import files will be stored while the import is being
    | performed.
    */
    'import_storage_disk' => env('SYNC_IMPORT_STORAGE_DISK', 'imports'),

    /*
    | Set which imports should be allowed for this instance.
    */
    'allowed_imports' => [
        'volumes',
        'labelTrees',
        'users',
    ],

    /*
     | Specifies which queue should be used for which job.
     */
    'postprocess_volume_import_queue' => env('SYNC_POSTPROCESS_VOLUME_IMPORT_QUEUE', 'default'),
];
