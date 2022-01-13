<?php

return [

    /*
    | Show a file browser to make creating volumes easier.
    */
    'browser' => false,

    /*
    | All storage disks that the file browser is allowed to access.
    */
    'browser_disks' => [
        'local',
    ],

    /*
    | Storage disk for iFDO metadata files linked with volumes.
    */
    'ifdo_storage_disk' => env('VOLUME_IFDO_STORAGE_DISK', 'ifdos'),
];
