'use strict';
/* 新世界地圖：九城鎮＋六路線（取代舊的單一校園地圖） */
const NEW_MAPS = {
 "chendu": {
  "music": "town",
  "qlv": 1,
  "theme": "t_dawn",
  "rows": [
   "TTTTTTTTTTTTTTTTTTTTTT",
   "T...F..............F.T",
   "T..RRRR......RRRR....T",
   "T..RRRR......RRRR....T",
   "T..#WDW......#WD#....T",
   "T....,..........,....T",
   "T..,,,,,,,,AA,,,,,,..T",
   "T..,.......AA.....,..T",
   "T..,.RRRRR....RRRR,..T",
   "T..,.RRRRR....RRRR,..T",
   "T..,.#WDW#....#WDW,..T",
   "T..,...,.........,,..T",
   "T..,,,,,,,,,,,,,,,,..T",
   "T.F....,........S....T",
   "T..====,====.....F...T",
   "TTTTTTT,TTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 7,
    "y": 15,
    "to": "r1",
    "tx": 7,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "5,4": {
    "to": "home",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 5,
     "y": 5
    }
   },
   "15,4": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 5
    }
   },
   "7,10": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 7,
     "y": 11
    }
   },
   "16,10": {
    "to": "c8",
    "tx": 6,
    "ty": 7,
    "dir": "up",
    "ret": {
     "x": 16,
     "y": 11
    }
   }
  },
  "shop": [
   "heal",
   "cure",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 10,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "tipHome",
    "x": 8,
    "y": 6,
    "dir": "down",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "cd1",
    "x": 2,
    "y": 13,
    "items": {
     "heal": 2
    }
   }
  ],
  "signs": {
   "16,13": "sign_chendu"
  }
 },
 "r1": {
  "music": "route",
  "qlv": 1,
  "theme": "t_dawn",
  "rows": [
   "TTTTTTT,TTTTTTTTTTTTTT",
   "T......,.............T",
   "T..gg..,...gggg......T",
   "T..gg..,...gggg......T",
   "T......,.............T",
   "T..,,,,,,,,,,,,,,,...T",
   "T..,........gg,......T",
   "T..,.gggg...gg,......T",
   "T..,.gggg.....,......T",
   "T..,..........,..gg..T",
   "T~~~~~~~~~~~~~,..gg..T",
   "T..,,,,,,,,,,,,,,,,..T",
   "T..,.................T",
   "T..,.gggg...gggg.....T",
   "T..,.gggg...gggg.....T",
   "T..,.................T",
   "TTT,TTTTTTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 7,
    "y": 0,
    "to": "chendu",
    "tx": 7,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 3,
    "y": 16,
    "to": "zhuyin",
    "tx": 3,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 6,
   "lv": [
    2,
    4
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "dictA",
    "x": 7,
    "y": 6,
    "dir": "right",
    "sight": 3
   },
   {
    "role": "dictB",
    "x": 14,
    "y": 12,
    "dir": "left",
    "sight": 3
   }
  ],
  "chests": [
   {
    "id": "r1a",
    "x": 18,
    "y": 2,
    "items": {
     "heal": 2,
     "hint": 1
    }
   }
  ]
 },
 "zhuyin": {
  "music": "town",
  "qlv": 1,
  "theme": "t_slope",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTTTT",
   "T..,...........n.......T",
   "T..,.^^^^^..^^^^^^^....T",
   "T..,...............,...T",
   "T..,RRRRRR.........,...T",
   "T..,#WD#W#....n....,...T",
   "T..,...............,...T",
   "T..,,,,,,,,,,,,,,,,,...T",
   "T...........,..........T",
   "T..S....RRRRRRRR...FF..T",
   "T.......RRRRRRRR.......T",
   "T.......#WW#DD#W#......T",
   "T...........,..........T",
   "T.^^^^^^^^^^,^^^^^^^^^.T",
   "T...........,..........T",
   "TTTTTTTTTTTT,TTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 3,
    "y": 0,
    "to": "r1",
    "tx": 3,
    "ty": 15,
    "dir": "up"
   },
   {
    "x": 12,
    "y": 15,
    "to": "r2",
    "tx": 12,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "6,5": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 6,
     "y": 6
    }
   },
   "12,11": {
    "to": "c1a",
    "tx": 6,
    "ty": 7,
    "dir": "up"
   },
   "13,11": {
    "to": "c1a",
    "tx": 6,
    "ty": 7,
    "dir": "up"
   }
  },
  "shop": [
   "heal",
   "cure",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 4,
    "y": 8,
    "dir": "down"
   },
   {
    "role": "gymTip1",
    "x": 11,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "townTip1",
    "x": 17,
    "y": 4,
    "dir": "left",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "zy1",
    "x": 20,
    "y": 9,
    "items": {
     "cure": 1,
     "heal": 2
    }
   }
  ],
  "signs": {
   "8,9": "sign_zhuyin"
  }
 },
 "r2": {
  "music": "route",
  "qlv": 2,
  "theme": "t_alley",
  "rows": [
   "TTTTTTTTTTTT,TTTTTTTT",
   "T...........,.......T",
   "T..gggg.....,..gggg.T",
   "T..gggg.....,..gggg.T",
   "T...........,.......T",
   "T..,,,,,,,,,,,,,,,,.T",
   "T..,................T",
   "T..,.gg....Q...gggg.T",
   "T..,.gg........gggg.T",
   "T..,................T",
   "T..,,,,,,,,,,,,,,,..T",
   "T................,..T",
   "T..gggg....gggg..,..T",
   "T..gggg....gggg..,..T",
   "T................,..T",
   "TTTTTTTTTTTTTTTTT,TTT"
  ],
  "warps": [
   {
    "x": 12,
    "y": 0,
    "to": "zhuyin",
    "tx": 12,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 17,
    "y": 15,
    "to": "chaoshu",
    "tx": 17,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 7,
   "lv": [
    4,
    7
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "t_r2a",
    "x": 7,
    "y": 7,
    "dir": "right",
    "sight": 3
   },
   {
    "role": "t_r2b",
    "x": 13,
    "y": 13,
    "dir": "left",
    "sight": 3
   }
  ],
  "chests": [
   {
    "id": "r2a",
    "x": 11,
    "y": 8,
    "frags": {
     "tome": 2
    },
    "items": {
     "heal": 1
    }
   }
  ]
 },
 "chaoshu": {
  "music": "town",
  "qlv": 2,
  "theme": "t_alley",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTT",
   "T................,..T",
   "T.RRRR.RRRR..,,,,,..T",
   "T.#WDW.#WDW..,......T",
   "T..,.....,...,......T",
   "T,,,,,,,,,,,,,,,,,,.T",
   "T..,..m..,.m.,..m...T",
   "T..,.....,...,......T",
   "T.RRRR.RRRRRR,.RRRR.T",
   "T.#WDW.#W#DW#,.#WD#.T",
   "T..,.....,...,......T",
   "T,,,,,,,,,,,,,,,,,,.T",
   "T..,..m..L...,......T",
   "T..,.........,......T",
   "T.RRRRRR.....,.RRRRRT",
   "T.#W#DW#.S...,.#WD#WT",
   "T............,......T",
   "TTTTTTTTTTTTT,TTTTTTT"
  ],
  "warps": [
   {
    "x": 17,
    "y": 0,
    "to": "r2",
    "tx": 17,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 13,
    "y": 17,
    "to": "r3",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "4,3": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 4
    }
   },
   "9,3": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 9,
     "y": 4
    }
   },
   "4,9": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 10
    },
    "forge": 1
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 14,
    "y": 5,
    "dir": "down"
   },
   {
    "role": "smith",
    "x": 5,
    "y": 10,
    "dir": "down"
   },
   {
    "role": "townTip2",
    "x": 15,
    "y": 6,
    "dir": "left",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "cs1",
    "x": 19,
    "y": 12,
    "items": {
     "hint": 2,
     "heal2": 1
    }
   }
  ],
  "signs": {
   "9,15": "sign_chaoshu"
  }
 },
 "r3": {
  "music": "route",
  "qlv": 2,
  "theme": "t_port",
  "rows": [
   "TTTTTTTTTTTTT,TTTTTTT",
   "T............,......T",
   "T..gggg......,.gggg.T",
   "T..gggg......,.gggg.T",
   "T............,......T",
   "T..,,,,,,,,,,,,,,,,.T",
   "T..,................T",
   "T..,..Q....gg...Q...T",
   "T..,.......gg.......T",
   "T..,................T",
   "T..,,,,,,,,,,,,,,,..T",
   "T................,..T",
   "T..gggg...gggg...,..T",
   "T..gggg...gggg...,..T",
   "T................,..T",
   "TTTTTTTTTTTTTTTTT,TTT"
  ],
  "warps": [
   {
    "x": 13,
    "y": 0,
    "to": "chaoshu",
    "tx": 13,
    "ty": 16,
    "dir": "up"
   },
   {
    "x": 17,
    "y": 15,
    "to": "dianji",
    "tx": 17,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 7,
   "lv": [
    6,
    9
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "t_r3a",
    "x": 8,
    "y": 8,
    "dir": "right",
    "sight": 3
   },
   {
    "role": "t_r3b",
    "x": 15,
    "y": 12,
    "dir": "left",
    "sight": 3
   }
  ],
  "chests": [
   {
    "id": "r3a",
    "x": 4,
    "y": 2,
    "items": {
     "atkup": 1,
     "heal": 2
    }
   }
  ]
 },
 "dianji": {
  "music": "town",
  "qlv": 2,
  "theme": "t_port",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTTTT",
   "T~~~~~~~~........,.....T",
   "T~~~~~~~~..Q.....,..L..T",
   "T~~~~~~~~........,.....T",
   "T....,,,,,,,,,,,,,,,,,.T",
   "T....,.......,.......,.T",
   "T.RRRRRR.....,...RRRRR.T",
   "T.#WD#W#.....,...#WD#W.T",
   "T....,.......,.......,.T",
   "T,,,,,,,,,,,,,,,,,,,,,,T",
   "T..Q.,.RRRRRRRRRR...,..T",
   "T....,.RRRRRRRRRR...,..T",
   "T....,.#W#WDD#W#W...,..T",
   "T....,.......,.......,.T",
   "T....,,,,,,,,,,,,,,,,,.T",
   "T.L....S.....,.........T",
   "TTTTTTTTTTTTT,TTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 17,
    "y": 0,
    "to": "r3",
    "tx": 17,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 13,
    "y": 16,
    "to": "r4",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "4,7": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 8
    }
   },
   "19,7": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 19,
     "y": 8
    }
   },
   "11,12": {
    "to": "lib",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 1,
    "gate": "need1"
   },
   "12,12": {
    "to": "lib",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 1,
    "gate": "need1"
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 6,
    "y": 9,
    "dir": "down"
   },
   {
    "role": "rival1",
    "x": 13,
    "y": 14,
    "dir": "up",
    "sight": 3
   },
   {
    "role": "gymTip2",
    "x": 10,
    "y": 13,
    "dir": "down"
   },
   {
    "role": "townTip3",
    "x": 19,
    "y": 10,
    "dir": "left",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "dj1",
    "x": 2,
    "y": 10,
    "items": {
     "heal2": 1,
     "cure": 1
    }
   }
  ],
  "signs": {
   "7,15": "sign_dianji"
  }
 },
 "r4": {
  "music": "route",
  "qlv": 2,
  "theme": "t_bamboo",
  "rows": [
   "TTTTTTTTTTTTT,TTTTTTT",
   "T............,......T",
   "T..gggg..~~~.,.gggg.T",
   "T..gggg..~~~.,.gggg.T",
   "T............,......T",
   "T..,,,,,,,,,,,,,,,,.T",
   "T..,................T",
   "T..,.gg..m...YY.....T",
   "T..,.gg......YY.....T",
   "T..,................T",
   "T..,,,,,,,,,,,,,,,..T",
   "T..,.............,..T",
   "T..,..gggg..gggg.,..T",
   "T..,..gggg..gggg.,..T",
   "T..,.............,..T",
   "TTT,TTTTTTTTTTTTT,TTT"
  ],
  "warps": [
   {
    "x": 13,
    "y": 0,
    "to": "dianji",
    "tx": 13,
    "ty": 15,
    "dir": "up"
   },
   {
    "x": 3,
    "y": 15,
    "to": "tingyu",
    "tx": 17,
    "ty": 1,
    "dir": "down"
   },
   {
    "x": 17,
    "y": 15,
    "to": "huanan",
    "tx": 3,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 8,
   "lv": [
    8,
    11
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "m1",
    "x": 6,
    "y": 7,
    "dir": "right",
    "sight": 3
   },
   {
    "role": "m2",
    "x": 13,
    "y": 12,
    "dir": "left",
    "sight": 3
   },
   {
    "role": "m3",
    "x": 9,
    "y": 13,
    "dir": "up",
    "sight": 2
   },
   {
    "role": "sideAGiver",
    "x": 13,
    "y": 4,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "r4a",
    "x": 18,
    "y": 2,
    "items": {
     "ward": 1,
     "heal2": 1
    }
   }
  ],
  "gates": {
   "17,15": "sideA"
  }
 },
 "tingyu": {
  "music": "town",
  "qlv": 2,
  "theme": "t_bamboo",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTT",
   "T................,...T",
   "T.YY.....AA......,...T",
   "T.YY.....AA......,...T",
   "T.....,,,,,,,,,,,,...T",
   "T,,,,,,..............T",
   "T.....,...~~~~.......T",
   "T.AA..,...~~~~..RRRR T",
   "T.AA..,...~~~~..#WDW T",
   "T.....,..............T",
   "T.YY..,,,,,,,,,,,....T",
   "T.YY..,.........,....T",
   "T.....,...S.....,....T",
   "TTTTTTTTTTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 17,
    "y": 0,
    "to": "r4",
    "tx": 3,
    "ty": 14,
    "dir": "up"
   }
  ],
  "doorWarps": {
   "18,8": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 18,
     "y": 9
    }
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 6,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "sparring",
    "x": 9,
    "y": 6,
    "dir": "down"
   },
   {
    "role": "townTip4",
    "x": 3,
    "y": 5,
    "dir": "right",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "ty1",
    "x": 19,
    "y": 2,
    "items": {
     "heal2": 2,
     "wenqi": 1
    }
   }
  ],
  "signs": {
   "10,12": "sign_tingyu"
  }
 },
 "huanan": {
  "music": "town",
  "qlv": 3,
  "theme": "t_flower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTTTT",
   "T..,.........,.....FF..T",
   "T..,RRRRRR.n.,.n..RRRR.T",
   "T..,#WD#W#...,....#WDW.T",
   "T..,.........,.......,.T",
   "T..,,,,,,,,,,,,,,,,,,,.T",
   "T.FF.,...n...,...n...,.T",
   "T....,.......,.......,.T",
   "T....,.RRRRRRRRRR....,.T",
   "T....,.RRRRRRRRRR....,.T",
   "T....,.#W#WDD#W#W....,.T",
   "T....,.......,.......,.T",
   "T,,,,,,,,,,,,,,,,,,,,,.T",
   "T.FF.....S...,.....FF..T",
   "T............,.........T",
   "TTTTTTTTTTTTT,TTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 3,
    "y": 0,
    "to": "r4",
    "tx": 17,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 13,
    "y": 15,
    "to": "r5",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "6,3": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 6,
     "y": 4
    }
   },
   "20,3": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 20,
     "y": 4
    }
   },
   "11,10": {
    "to": "yard",
    "tx": 10,
    "ty": 1,
    "dir": "up",
    "need": 2,
    "gate": "need2"
   },
   "12,10": {
    "to": "yard",
    "tx": 10,
    "ty": 1,
    "dir": "up",
    "need": 2,
    "gate": "need2"
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "dodgeup",
   "wenqi",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 4,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "gymTip3",
    "x": 11,
    "y": 11,
    "dir": "down"
   },
   {
    "role": "townTip5",
    "x": 18,
    "y": 6,
    "dir": "left",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "hn1",
    "x": 21,
    "y": 13,
    "items": {
     "dodgeup": 1,
     "heal2": 1
    }
   }
  ],
  "signs": {
   "9,13": "sign_huanan"
  }
 },
 "r5": {
  "music": "route",
  "qlv": 3,
  "theme": "t_stele",
  "rows": [
   "TTTTTTTTTTTTT,TTTTTTT",
   "T............,......T",
   "T.O..gggg....,.gggg.T",
   "T....gggg....,.gggg.T",
   "T............,......T",
   "T..,,,,,,,,,,,,,,,,.T",
   "T..,................T",
   "T..,..O.....O.......T",
   "T..,................T",
   "T..,.gggg...gggg....T",
   "T..,.gggg...gggg....T",
   "T..,,,,,,,,,,,,,,,..T",
   "T................,..T",
   "T..O.............,..T",
   "T................,..T",
   "TTTTTTTTTTTTTTTTT,TTT"
  ],
  "warps": [
   {
    "x": 13,
    "y": 0,
    "to": "huanan",
    "tx": 13,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 17,
    "y": 15,
    "to": "beilin",
    "tx": 17,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 8,
   "lv": [
    11,
    14
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "rival2",
    "x": 7,
    "y": 9,
    "dir": "right",
    "sight": 3
   },
   {
    "role": "t_r5a",
    "x": 14,
    "y": 13,
    "dir": "left",
    "sight": 3
   }
  ],
  "chests": [
   {
    "id": "r5a",
    "x": 18,
    "y": 2,
    "frags": {
     "classic": 2
    },
    "items": {
     "heal2": 1
    }
   }
  ]
 },
 "beilin": {
  "music": "town",
  "qlv": 3,
  "theme": "t_stele",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTTTT",
   "T................,.....T",
   "T.O.O.O..L.......,.L.O.T",
   "T....,,,,,,,,,,,,,,,,,.T",
   "T.O..,.......,.......,.T",
   "T....,.RRRRRR,RRRR...,.T",
   "T....,.#WD#W#,#WDW...,.T",
   "T,,,,,,,,,,,,,,,,,,,,,,T",
   "T.O..,.......,.......,.T",
   "T....,.RRRRRRRRRR....,.T",
   "T....,.RRRRRRRRRR....,.T",
   "T....,.#W#WDD#W#W....,.T",
   "T.O..,.......,.......,.T",
   "T....,,,,,,,,,,,,,,,,,.T",
   "T.O.O..S.....,.....O.O.T",
   "T............,.........T",
   "TTTTTTTTTTTTT,TTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 17,
    "y": 0,
    "to": "r5",
    "tx": 17,
    "ty": 14,
    "dir": "up"
   },
   {
    "x": 13,
    "y": 16,
    "to": "r6",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "9,6": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 9,
     "y": 7
    }
   },
   "16,6": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 16,
     "y": 7
    }
   },
   "11,11": {
    "to": "hist",
    "tx": 6,
    "ty": 10,
    "dir": "up",
    "need": 3,
    "gate": "need3"
   },
   "12,11": {
    "to": "hist",
    "tx": 6,
    "ty": 10,
    "dir": "up",
    "need": 3,
    "gate": "need3"
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "dodgeup",
   "wenqi",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 6,
    "y": 8,
    "dir": "down"
   },
   {
    "role": "gymTip4",
    "x": 11,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "townTip6",
    "x": 19,
    "y": 4,
    "dir": "left",
    "wander": 1
   }
  ],
  "chests": [
   {
    "id": "bl1",
    "x": 2,
    "y": 13,
    "items": {
     "heal2": 2,
     "cure": 2
    }
   }
  ],
  "signs": {
   "7,14": "sign_beilin"
  }
 },
 "r6": {
  "music": "route",
  "qlv": 3,
  "theme": "t_spring",
  "rows": [
   "TTTTTTTTTTTTT,TTTTTTT",
   "T............,......T",
   "T.O..gggg....,.gggg.T",
   "T....gggg....,.gggg.T",
   "T............,......T",
   "T..,,,,,,,,,,,,,,,,.T",
   "T..,................T",
   "T..,...ZZ....O......T",
   "T..,...ZZ...........T",
   "T..,................T",
   "T..,,,,,,,,,,,,,,,..T",
   "T..,.............,..T",
   "T..,..gggg..gggg.,..T",
   "T..,..gggg..gggg.,..T",
   "T..,.............,..T",
   "TTT,TTTTTTTTTTTTT,TTT"
  ],
  "warps": [
   {
    "x": 13,
    "y": 0,
    "to": "beilin",
    "tx": 13,
    "ty": 15,
    "dir": "up"
   },
   {
    "x": 3,
    "y": 15,
    "to": "moquan",
    "tx": 17,
    "ty": 1,
    "dir": "down"
   },
   {
    "x": 17,
    "y": 15,
    "to": "zhongta",
    "tx": 3,
    "ty": 1,
    "dir": "down"
   }
  ],
  "foes": {
   "n": 9,
   "lv": [
    14,
    18
   ],
   "scale": 1,
   "auto": 1
  },
  "npcs": [
   {
    "role": "sideBGiver",
    "x": 13,
    "y": 4,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "r6a",
    "x": 18,
    "y": 2,
    "items": {
     "ward": 2,
     "heal2": 2
    }
   }
  ],
  "gates": {
   "17,15": "sideB"
  },
  "devices": {
   "13,7": {
    "group": "paper",
    "flag": "pa1",
    "cat": "文言",
    "label": "准考證碎紙",
    "text": "一張被風吹住的碎紙卡在石碑縫裡。\\n（讀懂上面的字，才能把它抽出來。）",
    "ok": "碎紙拿到了！",
    "allText": "三張碎紙都找齊了！可以還給學弟妹了。"
   },
   "7,7": {
    "group": "paper",
    "flag": "pa2",
    "cat": "常識",
    "label": "准考證碎紙",
    "text": "第二張碎紙泡在泉水邊。",
    "ok": "碎紙拿到了！",
    "allText": "三張碎紙都找齊了！"
   },
   "6,12": {
    "group": "paper",
    "flag": "pa3",
    "cat": "成語",
    "label": "准考證碎紙",
    "text": "最後一張碎紙黏在草叢裡。",
    "ok": "碎紙拿到了！",
    "allText": "三張碎紙都找齊了！",
    "onAll": "sideB"
   }
  }
 },
 "moquan": {
  "music": "town",
  "qlv": 3,
  "theme": "t_spring",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTT",
   "T................,..T",
   "T.ZZZZ.......,,,,,..T",
   "T.ZZZZ.......,......T",
   "T....,,,,,,,,,......T",
   "T....,.......,......T",
   "T.RRRRRR.....,..RRRRT",
   "T.#WD#W#.....,..#WDWT",
   "T....,.......,......T",
   "T,,,,,,,,,,,,,,,,,,.T",
   "T....,..ZZZZZZ......T",
   "T....,..ZZZZZZ..O...T",
   "T....,.......,......T",
   "T..S.,.......,......T",
   "TTTTTTTTTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 17,
    "y": 0,
    "to": "r6",
    "tx": 3,
    "ty": 14,
    "dir": "up"
   }
  ],
  "doorWarps": {
   "4,7": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 8
    }
   },
   "18,7": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 18,
     "y": 8
    }
   },
   "16,11": {
    "to": "inkpool",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "ret": {
     "x": 16,
     "y": 12
    },
    "need": "stone"
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "dodgeup",
   "wenqi",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 6,
    "y": 9,
    "dir": "down"
   },
   {
    "role": "springTip",
    "x": 15,
    "y": 11,
    "dir": "left"
   },
   {
    "role": "ngHint",
    "x": 10,
    "y": 9,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "mq1",
    "x": 2,
    "y": 12,
    "items": {
     "heal2": 2,
     "ward": 1
    }
   }
  ],
  "signs": {
   "3,13": "sign_moquan"
  }
 },
 "zhongta": {
  "music": "town",
  "qlv": 3,
  "theme": "t_tower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTT",
   "T..,..RRRRRRRR.......T",
   "T..,..RRRRRRRR.......T",
   "T..,..RRRRRRRR.......T",
   "T..,..#W#WDD#W.......T",
   "T.n,......,,......n..T",
   "T..,......,,.........T",
   "T..,=====,,,=====....T",
   "T..,......,,.........T",
   "T..RRRR...,,...RRRR..T",
   "T..#WDW...,,...#WDW..T",
   "T.....,...,,...,.....T",
   "T,,,,,,,,,,,,,,,,,,,.T",
   "T..S..,...,,...,..S..T",
   "TTTTTTTTTTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 3,
    "y": 0,
    "to": "r6",
    "tx": 17,
    "ty": 14,
    "dir": "up"
   }
  ],
  "doorWarps": {
   "10,4": {
    "to": "aud",
    "tx": 7,
    "ty": 11,
    "dir": "up",
    "need": 4,
    "gate": "need4"
   },
   "11,4": {
    "to": "aud",
    "tx": 7,
    "ty": 11,
    "dir": "up",
    "need": 4,
    "gate": "need4"
   },
   "5,10": {
    "to": "clinic",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 5,
     "y": 11
    }
   },
   "17,10": {
    "to": "store",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 17,
     "y": 11
    }
   }
  },
  "shop": [
   "heal",
   "heal2",
   "cure",
   "ward",
   "atkup",
   "defup",
   "dodgeup",
   "wenqi",
   "hint"
  ],
  "npcs": [
   {
    "role": "busStop",
    "x": 6,
    "y": 12,
    "dir": "down"
   },
   {
    "role": "gymTip5",
    "x": 10,
    "y": 6,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "zt1",
    "x": 2,
    "y": 11,
    "items": {
     "heal2": 3,
     "cure": 2
    }
   }
  ],
  "signs": {
   "3,13": "sign_zhongta",
   "18,13": "sign_zhongta2"
  }
 }
};
Object.assign(LAYOUTS, NEW_MAPS);
for (const k of ['town1', 'route1', 'town2', 'gym1', 'hallway', 'campus']) delete LAYOUTS[k];

/* 舊室內地圖改接到新城鎮 */
const INTERIOR_LINKS = {
  c8:   [{ x: 6, y: 8, to: 'chendu', tx: 16, ty: 11, dir: 'down' }, { x: 7, y: 8, to: 'chendu', tx: 16, ty: 11, dir: 'down' }],
  c1a:  [{ x: 6, y: 8, to: 'zhuyin', tx: 12, ty: 12, dir: 'down' }, { x: 7, y: 8, to: 'zhuyin', tx: 13, ty: 12, dir: 'down' }],
  lib:  [{ x: 7, y: 11, to: 'dianji', tx: 11, ty: 13, dir: 'down' }, { x: 8, y: 11, to: 'dianji', tx: 12, ty: 13, dir: 'down' }],
  yard: [{ x: 10, y: 0, to: 'huanan', tx: 11, ty: 11, dir: 'down' }],
  hist: [{ x: 6, y: 11, to: 'beilin', tx: 11, ty: 12, dir: 'down' }, { x: 7, y: 11, to: 'beilin', tx: 12, ty: 12, dir: 'down' }],
  aud:  [{ x: 7, y: 12, to: 'zhongta', tx: 10, ty: 5, dir: 'down' }, { x: 8, y: 12, to: 'zhongta', tx: 11, ty: 5, dir: 'down' }],
  inkpool: [{ x: 7, y: 11, to: 'moquan', tx: 16, ty: 12, dir: 'down' }, { x: 8, y: 11, to: 'moquan', tx: 16, ty: 12, dir: 'down' }],
};
for (const [k, w] of Object.entries(INTERIOR_LINKS)) if (LAYOUTS[k]) LAYOUTS[k].warps = w;
/* 道館室內不再需要舊的關卡限制 */
for (const k of ['c1a', 'lib', 'yard', 'hist', 'aud']) if (LAYOUTS[k]) { delete LAYOUTS[k].gates; delete LAYOUTS[k].doorWarps; }
