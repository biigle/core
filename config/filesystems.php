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

        'reports' => [
            'driver' => 'local',
            'root' => storage_path('reports'),
        ],

        'geo-overlays' => [
            'driver' => 'local',
            'root' => storage_path('geo-overlays'),
        ],

        'swift' => [
            'driver'    => 'swift',
            'authUrl'   => env('OS_AUTH_URL', ''),
            'region'    => env('OS_REGION_NAME', ''),
            'user'      => env('OS_USERNAME', ''),
            'domain'    => env('OS_USER_DOMAIN_NAME', 'default'),
            'password'  => env('OS_PASSWORD', ''),
            'projectId' => env('OS_PROJECT_ID', ''),
            'container' => env('OS_CONTAINER_NAME', ''),
            'tempUrlKey' => env('OS_TEMP_URL_KEY', ''),
        ],

        'largo' => [
            'driver' => 'local',
            'root' => storage_path('app/public/largo-patches'),
            'url' => env('APP_URL').'/storage/largo-patches',
            'visibility' => 'public',
        ],

        'maia-tp' => [
            'driver' => 'local',
            'root' => storage_path('app/public/maia-tp'),
            'url' => env('APP_URL').'/storage/maia-tp',
            'visibility' => 'public',
        ],

        'maia-ac' => [
            'driver' => 'local',
            'root' => storage_path('app/public/maia-ac'),
            'url' => env('APP_URL').'/storage/maia-ac',
            'visibility' => 'public',
        ],

        'video-thumbs' => [
            'driver' => 'local',
            'root' => storage_path('app/public/video-thumbs'),
            'url' => env('APP_URL').'/storage/video-thumbs',
            'visibility' => 'public',
        ],

        'imports' => [
            'driver' => 'local',
            'root' => storage_path('imports'),
        ],

        'laserpoints' => [
            'driver' => 'local',
            'root' => storage_path('framework/cache/laserpoints'),
        ],

        'ifdos' => [
            'driver' => 'local',
            'root' => storage_path('ifdos'),
        ],

        'user-storage' => [
            'driver' => 'local',
            'root' => storage_path('user-storage'),
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
