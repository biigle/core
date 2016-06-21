<?php

return [

    /*
    | Directory where the temporary files for transect preprocessing are stored.
    | Make sure the database user is able to write to this directory.
    */
    'tmp_path' => storage_path('ate_tmp'),

    /*
    | Directory where the annotation patch images will be stored
    */
    'patch_storage' => storage_path('ate_patches'),

    /*
    | Directory where the ate dict files will be stored
    */
    'dict_storage' => storage_path('ate_dicts'),

    /*
    | Script for preprocessing a transect
    */
    'preprocess_script' => __DIR__.'/../Scripts/preprocess.py',

    /*
    | Location of the Python binary
    */
    'python' => '/usr/bin/python',

];
