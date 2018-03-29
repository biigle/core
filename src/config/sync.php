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
];
