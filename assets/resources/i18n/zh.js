/** v1.3.0(build2.0) 03.07(2).2019 **/

'use strict';
if (!window.i18n) {
  window.i18n = {};
}

if (!window.i18n.languages) {
  window.i18n.languages = {};
}

window.i18n.languages['zh'] = {
  "InsufficientResource": {
    "Gold": "Insufficient gold!",
    "Diamond": "Insufficient diamond!",
    "Energy": "Insufficient energy!",
  },
  "Tutorial": {
    "NarrativeStatements": {
      "0": "Hey boss, nice to meet you. Let's get started!",
      "1": "Look! Here's an undeveloped open space. We can start to build up a restaurant here.",
      "2": "Click the highlighted button to acquire the certificate for running your very first restaurant here.",
      "3": "Click the highlighted button to confirm building.",
      "4": "Click the highlighted button to finish the building.",
      "5": "Click the highlighted button to open the restaurant panel.",
      "6": "Click the highlighted button to upgrade your first restaurant.",
      "7": "Click the highlighted button to confirm upgrading.",
      "8": "Please wait.",
      "9": "Click the highlighted button to hire your first cook.",
      "10": "Click the highlighted button to confirm hiring the cook.",
      "11": "You're all set now!",
      "12": "",
    },
    "startFromUpgrade": "Hi boss, welcome back. Your business is just in the early stage. Come on, let's make it better! ",
    "startFromChef": "Hi boss, welcome back. The restaurant is not yet running, let's open it. ",
    "startFromCash": "Hello boss. Our restaurant is running well. Keep moving on!",

    "Finish": "Done",
    "Next": "Next>"

  },
  // write your key value pairs here
  "iconLabel": {
    "mapList": "All restaurants",
    "certificate": "cert",
    "mainMission": "mission",
    "store": "store",
    "notification": "message",
    "currentLimit": "Current Limit: ",
    "attack": "Attack",
  },
  "logout": {
    "tip": "Are you sure to quit the game?",
    "yes": "Quit",
    "no": "Cancel",
  },
  "login": {
    "label": {
      "phone": "phone number",
      "code": "verification code",
      "getCaptchaCode": "GetCode",
      "login": "Login",
      "anonymousLogin": "Continue anonymously",
    },
    "hint": {
      "phoneInputHint": "Enter phone number",
      "captchaInputHint": "Enter code",
      "enableGameCenterInSystemSettings": "This game needs GameCenter to proceed. Please enable it in \"System -> Game Center\", then come back to continue...",
      "AanonymousPlayerModeHint": 'You are about to continue as an anonymous player.\n  \nThis game recommends logging in by   \"Game Center\" which can be enabled in your phone \"System -> Game Center\", where your game data can be synchronized across all iPhones & iPads with the same account.\n \nAre you sure to proceed?'
    },
    "tips": {
      "CAPTCHA_ERR": 'Incorrect format',
      "PHONE_ERR": 'Incorrect format',
      "SMS_CAPTCHA_FREQUENT_REQUIRE": 'Request too often',
      "SMS_CAPTCHA_NOT_MATCH": 'Incorrect verification code',
      "TEST_USER": 'test account',
      "INCORRECT_PHONE_NUMBER": 'Incorrect phone number',
      "loginSuccess": "Logged in successfully, please wait...",
    
    },
  },
  "MainMission": {
    "panel": {
      "title": "Missions",
      "viewSubMission": "Check",
      "giftTitle": "Rewards:",
      "progress": "Progress:",
      "awarded": "Awarded",
    },
  },
  "subMission": {
    "panel": {
      "subMissionTitle": "Submission",
      "giftTitle": "Rewards: ",
      "getGift": "Claim Reward",
      "gotGift": "Received",
      "tip": {
        "gotGiftSuccess": "Rewards received successfully, keep on fighting!",
      },
    },
  },
  "cookPanel": {
    physical: "Business hours addition: ",
    cooking: "Gold addition: ",
    intelligence: "Energy addition: ",
    goodAt: "GoodAt: ",
    restaurantName: "Restaurant Name: ",
    cookLevel: {
      0: "S",
      1: "SR", 
      2: "SSR",
      3: "SSR",
      4: "SSR",
    },
  },
  biochoiceDialog: {
    "yes": "Yes"
  },
  "RestaurantBuildOrUpgradePanel": {
    "energyLabel": "Energy Efficiency:",
    "goldLabel": "Gold Efficiency:",
    "seatLabel": "Seat capacity:",
    "unLockedTip": "Upgrade to unlock",
    "noneUnlockedTip": "You've already unlocked all the food!",
    "energyUnit": "/guest",
    "goldUnit": "/guest",
    "yes": "Yes",
    "cancel": "Cancel",
    "title": {
      "restaurant": {
        "build": "Build up a restaurant",
        "upgrade": "Upgrade to level %s",
      },
    },
    "buildTip": "Building up %s, will cost %s energy. Do you want to proceed? ",
    "upgradeTip": "Upgrade will cost %s gold and take %s. Are you sure?",
    "boost": "Boost",
  },
  "tips": {
    nomoreRestaurantToAttack: "Attack fails, no more restaurant to attack!",
    cannotAttatckToTheSameVictim: "Attack fails, cannot attack to the same victim",
    terminateSuccess: "Terminate success!",
    attackSuccess: "Attack success!",
    kickAttackerSuccess: "Kick the attacker success!",
    "collectFail": "Something went wrong, please make sure that you have internet access and try again.",
    "lackOfDiamond": "Insufficient diamond to boost, please get some diamond first!",
    "startWork": {
      "fail": "Something went wrong, please make sure that you have internet access and try again.",
      "success": "The cook is on duty now!"
    },
    "startTutorial": "Start tutorials now!",
    "wait": "please wait",
    "boostSuccess": "Boost success!",
    "generalError": "Something went wrong, please make sure that you have internet access and try again.",
  },

  "restaurantPanel": {
    "goldEffective": "Production Rate：",
    "energyEffective": "Production Rate：",
    "energyUnit": " /sec",
    "goldUnit": " /sec",
    "BusinessHoursTitle": "Business Hours：",
    "workingTime": "Open: ",
    "getChef": "Are you sure to ?",
    "closed": "Closed",
    "minute": "min",
    "second": "sec",
    "cookButtonLabel": "Cook",
    "upgradeButtonLabel": "Upgrade",
  },
  "PlayerGetCooksConfirmationPanel": {
    "Title": "Hire a new cook",
    "Hint": "Do you want to hire a new cook?",
    "Yes": "Yes",
  },
  "PlayerBoostConfirmationPanel": {
    "Title": "Boost",
    "Hint": "Do you want to boost the upgrading?",
    "Yes": "Yes",
    "boostTip": "Boosting will cost ",
  },
  "digits": {
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
  },
  "restaurantLevel": "Level %s",
  "mapLoading": "Loading",
  "progressTip": "",
  "wsConnect": {
    "close": "Something went wrong, please login again.",
    "hasConnected": "WS has connected already",
    "reconnected": "WS has reconnected success",
    "reconnecting": "WS is reconnecting..",
  },
  network: {
    disconnected: "Something went wrong, please make sure that you have internet access and try again."
  },
  "Certificate": {
    "CannotBuildMore": "There's no more restaurant to be built on the current map!",
  },
  "duration": {
    "days": "%sd",
    "hours": "%sh",
    "minutes": "%sm",
    "seconds": "%ss",
  },
  "durationInNormal": {
    "days": "%s days",
    "hours": "%s hours",
    "minutes": "%s minutes",
    "seconds": "%s seconds",
  },
  "cook": {
    "workTip": "Work",
    "hire": "Hire",
    "finishUpgrade": "Click Me!",
  },
  "upgradeCompletePanel": {
    "title": "Upgrade Completed",
    "energyLabel": "Energy Efficiency: ",
    "goldLabel": "Gold Efficiency: ",
    "seatLabel": "Seat capacity: ",
    "unLockedTip": "You've unlocked  ",
    "noneUnlockedTip": " ",
    "energyUnit": "/guest",
    "goldUnit": "/guest",
  },
  notificationPanel: {
    "currentPageTitle": "Current Page: ",
    "totalPageTitle": "Total: ",
    "delete": "delete",
    "title": "Messages",
    detail: "detail",
  },
  notificationDetailPanel: {
    title: "Message",
  },
  iapPanel: {
    title: "Store",
  },
  errorHint: {
    lackOfGold: "Insufficient gold to proceed.",
    unKnown: "Something went wrong, please make sure that you have internet access and try again.",
  },
  Victim: {
    Scout: "View",
    Terminate: "Terminate",
    Attack: "Attack",
    Kick: "kick",
    attackerName : "attacker:  ",
    CancelScounting: "Back home",
  },
  CandidateVictimPoolIndicator: {
    view: "View"
  },
  CandidateVictimPoolPanel: {
    title: "Players"
  },
  ToAttackCookIndicator: {
    pick: "Pick"
  },
  ToAttackCookListPanel: {
    title: "Cooks"
  },
  FoodInformationPanel: {
    title: "Food",
    price: "The price: ",
  },
  BuildingInfo: {
    DisplayName: {
      Barn: "Barn",
      Laboratory: "Laboratory",
      Barrack: "Barrack",
      Headquarter: "Headquarter",
      Restaurant: "Restaurant"
    },
  },
  StateBuildableInstanceInfoPanel: {
    Level: "Level: ",
    Upgrade: "Upgrade",
    Cancel: "Cancel",
  },
};

