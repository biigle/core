<?php 

use \AcceptanceTester;

class HomeRedirectCest
{
	public function visitTheHomePageWhileNotLoggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/');
		$I->canSeeInCurrentUrl('/login');
	}

	public function visitTheHomePageWhileLoggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/login');
		$I->fillField('email','joe@example.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
		$I->amOnPage('/');
		$I->canSeeInCurrentUrl('/dashboard');
		$I->see('Joe User');
	}
}