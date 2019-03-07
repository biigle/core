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
    | Supported: "local", "ftp", "s3", "rackspace"
    |
    */

    'default' => env('FILESYSTEM_DRIVER', 'default'),

    /*
    |--------------------------------------------------------------------------
    | Default Cloud Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Many applications store files both locally and in the cloud. For this
    | reason, you may specify a default "cloud" driver here. This driver
    | will be bound as the Cloud disk implementation in the container.
    |
    */

    'cloud' => env('FILESYSTEM_CLOUD', 's3'),

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
        'local-tiles' => [
            'driver' => 'local',
            'root' => storage_path('tiles'),
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

    ],

];
