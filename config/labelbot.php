<?php

return [

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
    'onnx_url' => env('LABELBOT_ONNX_MODEL_URL', '/assets/dinov2_vits14.onnx'),
];
