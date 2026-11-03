Feature: OpenWeather login

  Background:
    Given I am on the sign in page

  @smoke
  Scenario: TEST-0013 [LOGIN] Validate sign in form shows the expected elements
    Then I should see the email field, the password field and the submit button
    And the password field should mask its input

  @smoke @auth
  Scenario: TEST-0014 [LOGIN] Validate successful login with valid credentials
    When I sign in with the valid account
    Then I should be signed in

  Scenario: TEST-0015 [LOGIN] Validate login fails with a wrong password
    When I sign in with the valid email and the password "WrongPass123!"
    Then I should see the error "Invalid Email or password"
    And I should remain on the sign in page

  Scenario: TEST-0016 [LOGIN] Validate login fails with an unregistered email
    When I sign in with email "not.registered@example.com" and password "WrongPass123!"
    Then I should see the error "Invalid Email or password"
    And I should remain on the sign in page

  Scenario: TEST-0017 [LOGIN] Validate login cannot be submitted with empty fields
    When I submit the form without filling it
    Then I should remain on the sign in page

  Scenario: TEST-0018 [LOGIN] Validate forgot password link is available
    When I click the forgot password link
    Then I should be on the password recovery page
