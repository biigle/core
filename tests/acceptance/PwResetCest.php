<?php

use \AcceptanceTester;

class PwResetCest
{
	
	public function accessTheResetPage(AcceptanceTester $I)
	{
		$I->amOnPage('/');
		$I->click('Forgot password?');
		$I->seeInCurrentUrl('/password/email');
		$I->see('Please enter your email address so we can send you a password reset link.');
	}

	public function resetSuccess(AcceptanceTester $I)
	{
		$I->amOnPage('/password/email');
		$I->fillField('email','joe@user.com');
		$I->click('Send reset link');
		$I->seeInCurrentUrl('/password/email');
		$I->see('We have e-mailed your password reset link!');
	}

	// everything else is already handled by unit/functional tests
	// the token can only be accessed via email so no acceptance test for that

}