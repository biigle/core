
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
    | HNSW Index name (Image Annotation)
    |--------------------------------------------------------------------------
    |
    | This is the name used when creating, dropping or checking the HNSW index.
    | The HNSW index is built on the vector column in the
    | image_annotation_label_feature_vectors table.
    */
    'HNSW_ImgAnno_index_name' => 'image_annotation_label_feature_vectors_vector_idx',

        /*
    |--------------------------------------------------------------------------
    | B-Tree Index name (Image Annotation)
    |--------------------------------------------------------------------------
    |
    | This is the name used when creating, dropping or checking the B-Tree index.
    | The B-Tree index is built on the label_tree_id column in the
    | image_annotation_label_feature_vectors table.
    */
    'B_Tree_ImgAnno_index_name' => 'image_annotation_label_feature_vectors_label_tree_id_index',

];
