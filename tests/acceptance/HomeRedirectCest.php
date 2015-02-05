<?php 

use \AcceptanceTester;

class HomeRedirectCest
{
	public function visitTheHomePageWhileNotLoggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/');
		$I->canSeeInCurrentUrl('/auth/login');
	}

	public function visitTheHomePageWhileLoggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/auth/login');
		$I->fillField('email','joe@example.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
		$I->amOnPage('/');
		$I->canSeeInCurrentUrl('/');
		$I->see('Joe User');
	}
}