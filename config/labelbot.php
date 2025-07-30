<?php

return [

    /*
    | Controls if the LabelBOT button in the UI is shown. This can be used to hide the
    | button while the HNSW index builds in the background. The button can be shown with
    | a switch of the env variable once the index is finished.
    |
    | This does not disable LabelBOT in the API endpoint!
    */
    'show_button' => env('LABELBOT_SHOW_BUTTON', true),

    /*
    |--------------------------------------------------------------------------
    | K for KNN (K-Nearest Neighbors)
    |--------------------------------------------------------------------------
    |
    | The value of K determines the number of nearest neighbors to consider
    | when performing a KNN search. This is used in both Approximate
    | Nearest Neighbor (ANN) and Exact KNN searches.
    */
    'K' => 100,

    /*
    |--------------------------------------------------------------------------
    | N for Top N Labels
    |--------------------------------------------------------------------------
    |
    | The value of N specifies how many top labels should be returned from
    | the search results. After performing a KNN or ANN search, the top N
    | labels (based on their distance to the query vector) will be selected
    | and returned.
    */
    'N' => 3,

    /*
    ---------------------------------------------------------------------------
    | M: Maximum Number of LabelBOT's Requests (Vector Searches)
    ---------------------------------------------------------------------------
    |
    | The value of M specifies the maximum number of vector searches in a row.
    | This value is only needed for the UI. Once the result of a vector search
    | is resolved by the user, a new request can be made. A higher value means more
    | concurrent searches and increased database workload.
    */
    'max_requests' => 5,

    /*
    |--------------------------------------------------------------------------
    | LabelBOT ONNX Model URL
    |--------------------------------------------------------------------------
    |
    | URL of the hosted ONNX model file for LabelBOT.
    */
    'onnx_url' => env('LABELBOT_ONNX_MODEL_URL', env('APP_URL').'/assets/dinov2_vits14.onnx'),

    /*
    | Array of label tree IDs that should be ignored by LabelBOT. Typically this should
    | be the global label tree that could otherwise taint the results of LabelBOT with
    | irrelevant suggestions.
    */
    'ignore_label_trees' => array_filter(explode(',', env('LABELBOT_IGNORE_LABEL_TREES', ''))),
];
