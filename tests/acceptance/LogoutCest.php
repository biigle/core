<?php
use \AcceptanceTester;

class LogoutCest
{
    protected function login(AcceptanceTester $I)
    {
        $I->amOnPage('/auth/login');
        $I->fillField('email','joe@user.com');
        $I->fillField('password','joespassword');
        $I->click('Login');
    }

    // tests
    /**
     * @before login
     */
    public function logoutFromDashboard(AcceptanceTester $I)
    {
        $I->amOnPage('/');
        $I->click('a[title="Logout"]');
        $I->seeInCurrentUrl('/');
        $I->cantSee('Joe User');
    }
}