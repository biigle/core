<?php

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth'
], function ($router) {
    $router->get('volumes/{id}/largo', [
        'as'   => 'largo',
        'uses' => 'LargoController@indexVolume',
    ]);

    $router->get('projects/{id}/largo', [
        'as'   => 'projectsLargo',
        'uses' => 'LargoController@indexProject',
    ]);
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->get('annotations/{id}/patch', [
        'uses' => 'LargoController@showPatch',
    ]);

    $router->post('volumes/{id}/largo', [
        'uses' => 'LargoController@saveVolume',
    ]);

    $router->get('volumes/{id}/annotations/filter/label/{id2}', [
        'uses' => 'VolumesAnnotationsController@filter',
    ]);

    $router->post('projects/{id}/largo', [
        'uses' => 'LargoController@saveProject',
    ]);

    $router->get('projects/{id}/annotations/filter/label/{id2}', [
        'uses' => 'ProjectsAnnotationsController@filter',
    ]);
});
