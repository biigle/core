<?php

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth',
], function ($router) {
    $router->get('volumes/{id}/largo', [
        'as'   => 'largo',
        'uses' => 'Volumes\LargoController@index',
    ]);

    $router->get('projects/{id}/largo', [
        'as'   => 'projectsLargo',
        'uses' => 'Projects\LargoController@index',
    ]);

    $router->get('label-trees/{id}/catalog', [
        'as'   => 'annotation-catalog',
        'uses' => 'LabelTrees\AnnotationCatalogController@show',
    ]);
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['api', 'auth:web,api'],
], function ($router) {
    $router->get('labels/{id}/image-annotations', [
        'uses' => 'Labels\ImageAnnotationsController@index',
    ]);

    $router->get('labels/{id}/video-annotations', [
        'uses' => 'Labels\VideoAnnotationsController@index',
    ]);

    $router->get('projects/{id}/annotations/sort/outliers/{id2}', [
        'uses' => 'Projects\SortAnnotationsByOutliersController@index',
    ]);

    $router->get('projects/{id}/annotations/sort/similarity', [
        'uses' => 'Projects\SortAnnotationsBySimilarityController@index',
    ]);

    $router->get('projects/{id}/image-annotations/filter/label/{id2}', [
        'uses' => 'Projects\FilterImageAnnotationsByLabelController@index',
    ]);

    $router->post('projects/{id}/largo', [
        'uses' => 'Projects\LargoController@save',
    ]);

    $router->get('projects/{id}/video-annotations/filter/label/{id2}', [
        'uses' => 'Projects\FilterVideoAnnotationsByLabelController@index',
    ]);

    $router->get('volumes/{id}/annotations/sort/outliers/{id2}', [
        'uses' => 'Volumes\SortAnnotationsByOutliersController@index',
    ]);

    $router->get('volumes/{id}/annotations/sort/similarity', [
        'uses' => 'Volumes\SortAnnotationsBySimilarityController@index',
    ]);

    $router->get('volumes/{id}/image-annotations/examples/{id2}', [
        'uses' => 'Volumes\ImageAnnotationExamplesController@index',
    ]);

    $router->get('volumes/{id}/image-annotations/filter/label/{id2}', [
        'uses' => 'Volumes\FilterImageAnnotationsByLabelController@index',
    ]);

    $router->post('volumes/{id}/largo', [
        'uses' => 'Volumes\LargoController@save',
    ]);

    $router->get('volumes/{id}/video-annotations/filter/label/{id2}', [
        'uses' => 'Volumes\FilterVideoAnnotationsByLabelController@index',
    ]);
});
