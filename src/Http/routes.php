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
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth:web,api',
], function ($router) {
    $router->get('annotations/{id}/patch', [
        'uses' => 'PatchController@show',
    ]);

    $router->post('volumes/{id}/largo', [
        'uses' => 'Volumes\LargoController@save',
    ]);

    $router->get('volumes/{id}/annotations/filter/label/{id2}', [
        'uses' => 'Volumes\FilterAnnotationsByLabelController@index',
    ]);

    $router->get('volumes/{id}/annotations/examples/{id2}', [
        'uses' => 'Volumes\AnnotationExamplesController@index',
    ]);

    $router->post('projects/{id}/largo', [
        'uses' => 'Projects\LargoController@save',
    ]);

    $router->get('projects/{id}/annotations/filter/label/{id2}', [
        'uses' => 'Projects\FilterAnnotationsByLabelController@index',
    ]);
});
