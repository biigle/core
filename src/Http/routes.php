<?php

$router->group(['middleware' => 'auth'], function ($router) {
    $router->get('label-trees/{id}', [
        'as'   => 'label-trees',
        'uses' => 'LabelTreesController@show',
    ]);

    $router->get('label-trees', [
        'as'   => 'label-trees-index',
        'uses' => 'LabelTreesController@index',
    ]);

    $router->get('admin/label-trees', [
        'as' => 'admin-global-label-trees',
        'middleware' => 'admin',
        'uses' => 'LabelTreesController@admin',
    ]);
});
