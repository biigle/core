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
    | Storage disks that are available to admins when a new volume is created.
    | Disks that should also be available to users with the editor role can be
    | configured in editor_storage_disks below.
    */
    'admin_storage_disks' => array_filter(explode(',', env('VOLUME_ADMIN_STORAGE_DISKS'))),

    /*
    | Storage disks that are available to editors when a new volume is created.
    |
    | All files will be visible to all these users!
    */
    'editor_storage_disks' => array_filter(explode(',', env('VOLUME_EDITOR_STORAGE_DISKS'))),

    /*
    | Storage disk for iFDO metadata files linked with volumes.
    */
    'ifdo_storage_disk' => env('VOLUME_IFDO_STORAGE_DISK', 'ifdos'),
];
