<?php

return [

    /*
    | Version of the biigle/core build.
    */
    'version' => env('BIIGLE_VERSION'),

    /*
    | Show the logfiles in the admin area.
    */
    'admin_logs' => env('BIIGLE_ADMIN_LOGS', true),

    /*
    | Email address of the admins of this BIIGLE instance.
    */
    'admin_email' => env('ADMIN_EMAIL', ''),

    /*
    | Disable all features that require a working internet connection.
    */
    'offline_mode' => env('BIIGLE_OFFLINE_MODE', false),

    /*
    | Enable user registration. This allows everybody to create a new user account.
    */
    'user_registration' => env('BIIGLE_USER_REGISTRATION', false),

    /*
    | Only allow user registration via SSO.
    */
    'sso_registration_only' => env('BIIGLE_SSO_REGISTRATION_ONLY', false),

    /*
    | Show this message to explain why only SSO registration is available.
    */
    'sso_registration_only_message' => env('BIIGLE_SSO_REGISTRATION_ONLY_MESSAGE', 'Please register via single sign-on below.'),

    /*
    | Enable user registration confirmation by admins. Whenever a new user is registered,
    | they are created with the global "guest" role and an email notification is sent to
    | the admin_email. If admins approve the registration, the global role of the new user
    | is changed to "editor". If they reject the registration, the new user is deleted.
    | If this is disabled, all new users immediately get the global "editor" role.
    |
    | This feature cannot be enabled in offline mode as it relies on emails.
    */
    'user_registration_confirmation' => env('BIIGLE_USER_REGISTRATION_CONFIRMATION', false),

    'federated_search' => [

        /*
        | Cache key to use for the federated search index.
        */
        'cache_key' => env('BIIGLE_FEDERATED_SEARCH_CACHE_KEY', 'federated_search_index'),

        /*
        | The queue to submit the "generate federated search index" job to.
        */
        'index_queue' => env('BIIGLE_FEDERATED_SEARCH_INDEX_QUEUE', 'default'),
    ],

    /*
    | Defines the maximum number of parameters allowed in a single SQL query. This is set to
    | 65535 to prevent exceeding the database's parameter limit, which can lead to errors.
    | Queries that need more parameters should be chunked to stay within this limit.
    */
    'db_param_limit' => 65535,
];
