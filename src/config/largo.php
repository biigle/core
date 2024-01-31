<?php

return [

    /*
    | Storage disk where the annotation patch images will be stored
    */
    'patch_storage_disk' => env('LARGO_PATCH_STORAGE_DISK'),

    /*
    | Image file format for the annotation patch images.
    | Must be supported by Python matplotlib.image.imsave.
    */
    'patch_format' => 'jpg',

    /*
    | Padding to add to each patch in x and y direction (in px).
    */
    'patch_padding' => 10,

    /*
    | Padding to add around a point annotation (in addition to the patch padding) in px.
    */
    'point_padding' => 64,

    /*
    | Time in Seconds to delay generating a new annotation patch.
    | This saves resources for annotations that are quickly removed again.
    */
    'patch_generation_delay' => 10,

    /*
     | Specifies which queue should be used for which job.
     */
    'generate_annotation_patch_queue' => env('LARGO_GENERATE_ANNOTATION_PATCH_QUEUE', 'default'),
    'remove_annotation_patches_queue' => env('LARGO_REMOVE_ANNOTATION_PATCHES_QUEUE', 'default'),

    /*
     | Specifies which queue should be used for the job to save a Largo session.
     */
    'apply_session_queue' => env('LARGO_APPLY_SESSION_QUEUE', 'default'),

    /*
    | Path to the extract features script.
    */
    'extract_features_script' => __DIR__.'/../resources/scripts/ExtractFeatures.py',

    /*
    | Path to the directory to use as Torch Hub cache.
    */
    'torch_hub_path' => storage_path('largo_cache'),

    /*
    | Path to the Python executable.
    */
    'python' => env('LARGO_PYTHON', '/usr/bin/python3'),

    /*
    | This sets the OMP_NUM_THREADS environment variable of the Python process to generate
    | feature vectors. It is ignored with CUDA but it dramatically increases the inference
    | speed on a CPU.
    |
    | See also: https://pytorch.org/tutorials/intermediate/torchserve_with_ipex.html
    */
    'omp_num_threads' => env('LARGO_OMP_NUM_THREADS', 2),
];
