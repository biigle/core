<?php
use \AcceptanceTester;

class DashboardCest
{

	protected function loggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/auth/login');
		$I->fillField('email','joe@user.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
	}

	// tests
	/**
	 * @before loggedIn
	 */
	public function seeMyProjects(AcceptanceTester $I)
	{
		$I->see('Projects');
		$I->see('Test Project');
		$I->see('Test Project 2');
		$I->see('New Project');
	}
}