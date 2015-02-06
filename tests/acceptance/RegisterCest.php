<?php

use \AcceptanceTester;

class RegisterCest
{

	protected function registerPage(AcceptanceTester $I)
	{
		$I->amOnPage('/auth/register');
	}

	
	public function accessTheRegisterPage(AcceptanceTester $I)
	{
		$I->amOnPage('/');
		$I->click('Register');
		$I->seeInCurrentUrl('/auth/register');
		$I->see('Create an account');
	}

	public function accessTheRegisterPageWhenLoggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/');
		$I->fillField('email','joe@user.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
		$I->amOnPage('/auth/register');
		$I->seeInCurrentUrl('/');
	}

	/**
	 * @before registerPage
	 */
	public function registerWithoutData(AcceptanceTester $I)
	{
		$I->click('Register');
		$I->see('The email field is required.');
		$I->see('The password field is required.');
		$I->see('The firstname field is required.');
		$I->see('The lastname field is required.');
	}

	/**
	 * @before registerPage
	 */
	public function registerWithFalseData(AcceptanceTester $I)
	{
		$I->fillField('email','test@test');
		$I->fillField('password','test');
		$I->click('Register');
		$I->see('The email must be a valid email address.');
		$I->see('The password must be at least 8 characters.');
	}

	/**
	 * @before registerPage
	 */
	public function registerWithCorrectData(AcceptanceTester $I)
	{
		$I->fillField('email','test@test.com');
		$I->fillField('password','testtest');
		$I->fillField('password_confirmation','testtest');
		$I->fillField('firstname','testtest');
		$I->fillField('lastname','testtest');
		$I->click('Register');
		$I->seeInCurrentUrl('/');
		$I->see('testtest testtest');
	}

	/**
	 * @before registerPage
	 */
	public function registerWithAlreadyTakenEmail(AcceptanceTester $I)
	{
		$I->fillField('email','joe@user.com');
		$I->fillField('password','testtest');
		$I->fillField('password_confirmation','testtest');
		$I->fillField('firstname','testtest');
		$I->fillField('lastname','testtest');
		$I->click('Register');
		$I->seeInCurrentUrl('/auth/register');
		$I->see('The email has already been taken.');
	}

}