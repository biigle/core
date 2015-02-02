<?php
use \AcceptanceTester;

class LoginCest
{
	public function _before(AcceptanceTester $I)
	{
	}

	public function _after(AcceptanceTester $I)
	{
	}

	protected function loginPage(AcceptanceTester $I)
	{
		$I->amOnPage('/login');
	}

	// tests
	/**
	 * @before loginPage
	 */
	public function loginWithoutCredentials(AcceptanceTester $I)
	{
		$I->click('Login');
		$I->see('The email field is required.');
		$I->see('The password field is required.');
		$I->cantSeeInCurrentUrl('/dashboard');
	}

	/**
	 * @before loginPage
	 */
	public function loginWithWrongCredentials(AcceptanceTester $I)
	{
		$I->fillField('email','test@test.com');
		$I->fillField('password','testtest');
		$I->click('Login');
		$I->cantSeeInCurrentUrl('/dashboard');
		$I->see('Invalid username and/or password.');
	}

	/**
	 * @before loginPage
	 */
	public function loginWithCorrectCredentials(AcceptanceTester $I)
	{
		$I->fillField('email','test@example.com');
		$I->fillField('password','example');
		$I->click('Login');
		$I->seeInCurrentUrl('/dashboard');
		$I->see('Joe User');
	}
}