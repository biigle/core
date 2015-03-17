<?php
use \AcceptanceTester;

class IndexCest
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
	public function viewAProject(AcceptanceTester $I)
	{
		$I->click('a[title="Show Test Project"]');
		$I->see('Test Project');
		$I->see('This is a test project');
		$I->see('Joe User');
		$I->cantSee('No admins');
		$I->see('Jane User');
		$I->cantSee('No editors');
		$I->see('No guests');
	}
}