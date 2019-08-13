<?php

$router->group(['middleware' => 'auth'], function ($router) {
    $router->get('label-trees', [
        'as'   => 'label-trees-index',
        'uses' => 'LabelTreesController@index',
    ]);

    $router->get('label-trees/create', [
        'as'   => 'label-trees-create',
        'uses' => 'LabelTreesController@create',
    ]);

    $router->get('label-trees/{id}', [
        'as'   => 'label-trees',
        'uses' => 'LabelTreesController@show',
    ]);

    $router->get('label-trees/{id}/merge', [
        'as'   => 'label-trees-merge-index',
        'uses' => 'LabelTreeMergeController@index',
    ]);

    $router->get('label-trees/{id}/merge/{id2}', [
        'as'   => 'label-trees-merge',
        'uses' => 'LabelTreeMergeController@show',
    ]);

    $router->get('label-trees/{id}/versions/{id2}', [
        'as'   => 'label-tree-versions',
        'uses' => 'LabelTreeVersionsController@show',
    ]);

    $router->get('label-trees/{id}/versions/create', [
        'as'   => 'create-label-tree-versions',
        'uses' => 'LabelTreeVersionsController@create',
    ]);

    $router->get('admin/label-trees', [
        'as' => 'admin-global-label-trees',
        'middleware' => 'can:sudo',
        'uses' => 'LabelTreesController@admin',
    ]);

});

$router->group([
        'middleware' => 'auth:web,api',
        'prefix' => 'api/v1',
        'namespace' => 'Api',
    ], function ($router) {
        $router->resource('label-trees.merge-labels', 'LabelTreeMergeController', [
            'only' => ['store'],
            'parameters' => ['label-trees' => 'id'],
        ]);
});
