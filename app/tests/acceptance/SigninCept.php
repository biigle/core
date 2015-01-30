<?php 

// $I = new AcceptanceTester($scenario);
// $I->wantTo('log in as regular user without credentials');
// $I->amOnPage('/login');
// // $I->fillField('#email','info@tntstudio.hr');
// // $I->fillField('#password','password');
// $I->click('Login');
// $I->see('The email field is required.');
// $I->see('The password field is required.');

$I = new AcceptanceTester($scenario);
$I->wantTo('log in as regular user with credentials');
$I->amOnPage('/login');
$I->fillField('#email','test@example.com');
$I->fillField('#password','example');
$I->click('Login');
$I->see('Hello Joe.');
$I->seeInPageSource('Logout');