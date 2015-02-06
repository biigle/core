<?php
use \AcceptanceTester;

class LoginCest
{

	protected function loginPage(AcceptanceTester $I)
	{
		$I->amOnPage('/auth/login');
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
	}

	/**
	 * @before loginPage
	 */
	public function loginWithoutData(AcceptanceTester $I)
	{
		$I->click('Login');
		$I->see('The email field is required.');
		$I->see('The password field is required.');
	}

	/**
	 * @before loginPage
	 */
	public function loginWithFalseData(AcceptanceTester $I)
	{
		$I->fillField('email','test@test');
		$I->fillField('password','test');
		$I->click('Login');
		$I->see('The email must be a valid email address.');
		$I->see('The password must be at least 8 characters.');
	}

	/**
	 * @before loginPage
	 */
	public function loginWithWrongCredentials(AcceptanceTester $I)
	{
		$I->fillField('email','test@test.com');
		$I->fillField('password','testtest');
		$I->click('Login');
		$I->see('These credentials do not match our records.');
	}

	/**
	 * @before loginPage
	 */
	public function loginWithCorrectCredentials(AcceptanceTester $I)
	{
		$I->fillField('email','joe@user.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
		$I->see('Joe User');
	}
}