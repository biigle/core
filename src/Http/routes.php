<?php

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth'
], function ($router) {
    $router->get('volumes/{id}/ate', [
        'as'   => 'ate',
        'uses' => 'AteController@indexVolume',
    ]);

    $router->get('projects/{id}/ate', [
        'as'   => 'projectsAte',
        'uses' => 'AteController@indexProject',
    ]);
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->get('annotations/{id}/patch', [
        'uses' => 'AteController@showPatch',
    ]);

    $router->post('volumes/{id}/ate', [
        'uses' => 'AteController@saveVolume',
    ]);

    $router->get('volumes/{id}/annotations/filter/label/{id2}', [
        'uses' => 'VolumesAnnotationsController@filter',
    ]);

    $router->post('projects/{id}/ate', [
        'uses' => 'AteController@saveProject',
    ]);

    $router->get('projects/{id}/annotations/filter/label/{id2}', [
        'uses' => 'ProjectsAnnotationsController@filter',
    ]);
});
