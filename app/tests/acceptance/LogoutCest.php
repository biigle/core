<?php
use \AcceptanceTester;

class LogoutCest
{
    public function _before(AcceptanceTester $I)
    {
    }

    public function _after(AcceptanceTester $I)
    {
    }

    protected function login(AcceptanceTester $I)
    {
        $I->amOnPage('/login');
        $I->fillField('email','joe@example.com');
        $I->fillField('password','joespassword');
        $I->click('Login');
    }

    // tests
    /**
     * @before login
     */
    public function logoutFromDashboard(AcceptanceTester $I)
    {
        $I->amOnPage('/dashboard');
        $I->click('button[title="Logout"]');
        $I->seeInCurrentUrl('/login');
    }
}