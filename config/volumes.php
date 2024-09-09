<?php

return [

    /*
    | Storage disks that are available to admins when a new volume is created.
    | Disks that should also be available to users with the editor role can be
    | configured in editor_storage_disks below.
    */
    'admin_storage_disks' => array_filter(explode(',', env('VOLUME_ADMIN_STORAGE_DISKS', ''))),

    /*
    | Storage disks that are available to editors when a new volume is created.
    |
    | All files will be visible to all these users!
    */
    'editor_storage_disks' => array_filter(explode(',', env('VOLUME_EDITOR_STORAGE_DISKS', ''))),

    /*
    | Storage disk for metadata files linked with volumes.
    */
    'metadata_storage_disk' => env('VOLUME_METADATA_STORAGE_DISK', 'metadata'),


    /*
    | Storage disk for metadata files of pending volumes.
    */
    'pending_metadata_storage_disk' => env('VOLUME_PENDING_METADATA_STORAGE_DISK', 'pending-metadata'),
];
