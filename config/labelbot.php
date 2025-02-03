
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
    |--------------------------------------------------------------------------
    | Model ONNX file
    |--------------------------------------------------------------------------
    | 
    | Path to the ONNX file for the DINOv2 ViT-S/14 (384) model, used to generate
    | the feature vector for LabelBOT vector search.
    */
    'onnx_file' => 'assets/dinov2_vits14.onnx'
];
