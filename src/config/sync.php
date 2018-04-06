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
    | Path to the directory to store import files to while the import is being performed.
    */
    'import_storage' => storage_path('imports'),
];
