"use strict";


var _ROUTE_PATH;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var constants = {
  PEOPLE_IMG_PATH: "animation/FrameAnimTextures/People/FrameAnimPeoples",
  FOOD_IMG_PATH: "textures/GUIElements/FoodIcon",
  ENABLE_MAPLIST_BUTTON_MISSIONId: 2,
  BGM: {
    DIR_PATH: "resources/BGM/",
    COLLECT_CASH_FILE_NAME: "collectCash.mp3",
    BUTTON_CLICK_EFFECT_FILE_NAME: "buttonClick.mp3",
    COLLECT_CASH_FILE_NAME: "collectCash.mp3",
    GOT_CERT_FILE_NAME: "gotCert.mp3"
  },
  COOK_ANIM: {
    DIR_PATH: "animation/Cook_"
  },
  NPC_NUM: 60,
  NPC_ANIM: {
    GUEST01: {
      NAME: "GUEST01", // Used for indexing to this object, same for others.
      DIR_PATH: "animation/Guest_1"
    },
    GUEST02: {
      NAME: "GUEST02",
      DIR_PATH: "animation/Guest_2"
    },
    GUEST03: {
      NAME: "GUEST03",
      DIR_PATH: "animation/Guest_3"
    },
    GUEST04: {
      NAME: "GUEST04",
      DIR_PATH: "animation/Guest_4"
    },
  },
  WANDERING_NPC_ANIM: {
    DOG: {
      WALKING: "animation/Dog/Walking",
      STOPPED: "animation/Dog/Resting",
    },
    HEN: {
      WALKING: "animation/Hen/Walking",
      STOPPED: "animation/Hen/StoppedEating",
    },
    DUCK: {
      WALKING: "animation/Duck/Walking",
      STOPPED: "animation/Duck/Flying",
    },
  },
  PATROL_NPC_ANIM: {
    PATROL_NPC01: {
      NAME: "PATROL_NPC1",
      DIR_PATH: "animation/PatrolNpc_1"
    },
    GUEST02: {
      NAME: "GUEST02",
      DIR_PATH: "animation/Guest_2"
    },
    GUEST03: {
      NAME: "GUEST03",
      DIR_PATH: "animation/Guest_3"
    },
    GUEST04: {
      NAME: "GUEST04",
      DIR_PATH: "animation/Guest_4"
    },
  },
  SOCKET_EVENT: {
    CONTROL: "control",
    SYNC: "sync",
    LOGIN: "login",
    CREATE: "create"
  },
  ROUTE_PATH: {
    PLAYER: "/Player",
    API: "/api",
    IAP: "/Iap",
    RECEIPT: "/Receipt",
    SUBMIT: "/Submit",
    VERSION: "/v1",
    SMS_CAPTCHA: "/SmsCaptcha",
    GAME_CENTER: "/GameCenter",
    INT_AUTH_TOKEN: "/IntAuthToken",
    LOGIN: "/Login",
    LOGOUT: "/Logout",
    OBTAIN: "/Obtain",
    REPORT: "/Report",
    QUERY: "/Query",
    ANONYMOUS: "/Anonymous",
    DARWIN: "/Darwin",
    GLOBAL: "/Global",
    AUTH_CONF: "/AuthConf",
    BUILDABLE_LEVEL_CONF: "/BuildableLevelConf",
    UUID: "/Uuid",
    RET_CODE: "/RetCode",
    REGEX: "/Regex",
    MYSQL: "/MySQL",
    SYNCDATA: "/SyncData",
    UPSYNC:"/Upsync", 
  }, 
  COLLECT_CASH_NUM: 100,
  RET_CODE: {
    "__comment__": "基础",
    "OK": 1000,
    "INVALID_TOKEN": 2001,
    "LACK_OF_DIAMOND": 1006,
    "LACK_OF_GOLD": 1007,
    "LACK_OF_ENERGY": 1008,
    "DUPLICATED": 2002,
    "UNKNOWN_ERROR": 1001,
    "INVALID_REQUEST_PARAM": 1002,
    "VICTIM_RESTAURANT_IS_ATTACKING": 65536,
    "VICTIM_RESTAURANT_IS_WORKING": 65537,
    "IS_TEST_ACC": 1003,
    "MYSQL_ERROR": 1004,
    "LACK_OF_GOLD": 1007,
    "LACK_OF_DIAMOND": 1006,
    "LACK_OF_ENERGY": 1008,

    "__comment__": "SMS",
    "SMS_CAPTCHA_REQUESTED_TOO_FREQUENTLY": 5001,
    "SMS_CAPTCHA_NOT_MATCH": 5002,
    "INVALID_TOKEN": 2001,

    "DUPLICATED": 2002,
    "INCORRECT_HANDLE": 2004,
    "NONEXISTENT_HANDLE": 2005,
    "INCORRECT_PASSWORD": 2006,
    "INCORRECT_CAPTCHA": 2007,
    "INVALID_EMAIL_LITERAL": 2008,
    "NO_ASSOCIATED_EMAIL": 2009,
    "SEND_EMAIL_TIMEOUT": 2010,
    "INCORRECT_PHONE_COUNTRY_CODE": 2011,
    "NEW_HANDLE_CONFLICT": 2013,
    "FAILED_TO_UPDATE": 2014,
    "FAILED_TO_DELETE": 2015,
    "FAILED_TO_CREATE": 2016,
    "INCORRECT_PHONE_NUMBER": 2018,
    "INVALID_KIOSK_CREDENTIALS": 3000,
    "INSUFFICIENT_MEM_TO_ALLOCATE_CONNECTION": 3001,
    "KIOSK_ALREADY_CONNECTED": 3002,
    "NONEXISTENT_KIOSK": 3003,
    "PASSWORD_RESET_CODE_GENERATION_PER_EMAIL_TOO_FREQUENTLY": 4000,
    "TRADE_CREATION_TOO_FREQUENTLY": 4002,
    "MAP_NOT_UNLOCKED": 4003,

    "NOT_IMPLEMENTED_YET": 65535,
  },
  ALERT: {
    TIP_NODE: 'captchaTips',
    TIP_LABEL: {
      INCORRECT_PHONE_COUNTRY_CODE: '国家号不正确',
      CAPTCHA_ERR: '验证码不正确',
      PHONE_ERR: '手机号格式不正确',
      TOKEN_EXPIRED: 'token已过期!',
      SMS_CAPTCHA_FREQUENT_REQUIRE: '请求过于频繁',
      SMS_CAPTCHA_NOT_MATCH: '验证码不正确',
      TEST_USER: '该账号为测试账号',
      INCORRECT_PHONE_NUMBER: '手机号不正确',
      LOG_OUT: '您已在其他地方登陆',
    },
  },
  AUDIO_PATH: {
    BGM: 'res/raw-assets/resources/audio/BGM.mp3',
    SCORE: 'res/raw-assets/resources/audio/score.mp3',
    CLICK: 'res/raw-assets/resources/audio/click.mp3'
  },
  TUTORIAL_STAGE: {
    NOT_YET_STARTED: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    ENDED: 11,
  },
  CURRENCY: {
    DIAMOND: 1,
    GOLD: 2,
    ENERGY: 3
  },
  COMPLETE_STATE: {
    NOT_COMPLETE: 0,
    COMPLETED_NOT_GET_GIFT: 1,
    COMPLETED_GET_GIFT: 2
  },
  TIME_CHUNK: {
    MILLIS_IN_SECOND: 1000,
    SECONDS_IN_MINUTE: 60,
    MINUTES_IN_HOUR: 60,
    HOURS_IN_DAY: 24,

    SECONDS_IN_HOUR: 3600,
    SECONDS_IN_DAY: 86400,
  },
  DIAMOND_PRODUCT_INFO: {
    MediumDiamondPackage: {
      DIAMOND_NUM: 20,
    },
    LittleDiamondPackage: {
      DIAMOND_NUM: 10,
    },
    LargeDiamondPackage: {
      DIAMOND_NUM: 50,
    },
  },
  PAGER: {
    NUM_PER_PAGE: 4
  },
  ATTACK_STATE: {
    INITIAL: 0,
    ATTACKING: 2,
  },
  COOK_STATE: {
    IDLE: 1,
    WORK_FOR_OWN_RESTAURANT: 2,
    WORK_FOR_VICTIM_RESTAURANT:3,
  },
  GEN_GUEST_DURATION_MILLIS: 3000,
  BUILDING_SOURCE_PATH: {
    ROOT_PATH: "textures/Building",
  },
};
window.language = "en";
window.constants = constants;
