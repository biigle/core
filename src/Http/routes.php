<?php

$router->group(['middleware' => 'auth'], function ($router) {
    $router->get('label-trees/{id}', [
        'as'   => 'label-trees',
        'uses' => 'LabelTreesController@index',
    ]);

    $router->get('admin/label-trees', [
        'as' => 'admin-global-label-trees',
        'middleware' => 'admin',
        'uses' => 'LabelTreesController@admin',
    ]);
});
