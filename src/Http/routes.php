<?php


$router->get('label-trees/{id}', [
    'middleware' => 'auth',
    'as'   => 'label-trees',
    'uses' => 'LabelTreesController@index',
]);
