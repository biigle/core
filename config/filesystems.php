<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. A "local" driver, as well as a variety of cloud
    | based drivers are available for your choosing. Just store away!
    |
    | Supported: "local", "ftp", "sftp", "s3"
    |
    */

    'default' => env('FILESYSTEM_DISK', env('FILESYSTEM_DRIVER', 'local')),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Here you may configure as many filesystem "disks" as you wish, and you
    | may even configure multiple disks of the same driver. Defaults have
    | been setup for each driver as an example of the required options.
    |
    | Note: Disks with the name "user-[number]" or "disk-[number]" may be reserved
    | for the biigle/user-storage and biigle/user-disks modules.
    */

    'disks' => [

        // Default storage disk for images.
        'local' => [
            'driver' => 'local',
            'root' => storage_path('images'),
        ],

        // Default storage disk for image tiles.
        'tiles' => [
            'driver' => 'local',
            'root' => storage_path('app/public/tiles'),
            'url' => env('APP_URL').'/storage/tiles',
            'visibility' => 'public',
        ],

        'thumbs' => [
            'driver' => 'local',
            'root' => storage_path('app/public/thumbs'),
            'url' => env('APP_URL').'/storage/thumbs',
            'visibility' => 'public',
        ],

        'video-thumbs' => [
            'driver' => 'local',
            'root' => storage_path('app/public/video-thumbs'),
            'url' => env('APP_URL').'/storage/video-thumbs',
            'visibility' => 'public',
        ],

        'ifdos' => [
            'driver' => 'local',
            'root' => storage_path('ifdos'),
        ],

        'geo-overlays' => [
            'driver' => 'local',
            'root' => storage_path('app/public/geo-overlays'),
            'url' => env('APP_URL').'/storage/geo-overlays',
            'visibility' => 'public',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
