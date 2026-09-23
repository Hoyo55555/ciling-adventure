'use strict';
/* 新世界地圖：九城鎮＋六路線（取代舊的單一校園地圖） */
const NEW_MAPS = {
 "chendu": {
  "music": "town",
  "qlv": 1,
  "theme": "t_dawn",
  "rows": [
   "TTTTTTTTTTTTTTTTTTTTTT",
   "TJJJF..............F.T",
   "TJJRRRR......cccc....T",
   "TJJRRRR......cccc....T",
   "TJJ#WDW......#WD#....T",
   "T...N,........N.,....T",
   "T..,,,,,,,,AA,,,,,,..T",
   "T..,.......AA.....,..T",
   "T..,.hhhhh....RRRR,..T",
   "T..,.hhhhh....RRRR,..T",
   "T..,.#WDW#....#WDW,..T",
   "T..,..N,.......N.,,..T",
   "TJJJJ,,,,,,,,,,,,,,..T",
   "TJFJJ..,........S....T",
   "TJJ====,====.....F...T",
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
    "to": "store_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 5
    }
   },
   "7,10": {
    "to": "clinic_h",
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
   },
   {
    "role": "roamHint",
    "x": 8,
    "y": 6,
    "dir": "down"
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
   "16,13": "sign_chendu",
   "4,5": "sg0",
   "14,5": "sg1",
   "6,11": "sg2",
   "15,11": "sg3"
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
    "dir": "down"
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
   "Tii,...............,...T",
   "Tii,hhhhhh.........,...T",
   "Tii,#WD#W#....n....,...T",
   "Tii,.N.............,...T",
   "Tii,,,,,,,,,,,,,,,,,...T",
   "Tii..UUUU...KKKKKKKKK..T",
   "TiiS.UUUGGGGGGGGKKKFF..T",
   "Tii..UUUGGGGGGGGKKKKK..T",
   "Tii.....#WW#DD#W#KKKK..T",
   "Tii......NN...N........T",
   "Ti^^^^^^^^^^,^^^^^^^^^.T",
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
    "to": "clinic_h",
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
    "role": "roamHint",
    "x": 17,
    "y": 4,
    "dir": "down"
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
   "8,9": "sign_zhuyin",
   "5,6": "sg4",
   "10,12": "sg29",
   "9,12": "sg5",
   "14,12": "sg6"
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
    "dir": "down"
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
   "T.cccc.hhhh..,,,I,..T",
   "T.#WDW.#WDW..,......T",
   "T..N....N,...,......T",
   "T,,,,,,,,,,,,,,,,,,.T",
   "T..,..m..,.m.,..m...T",
   "T..,.....,...,......T",
   "T.cccc.RRRRRR,.RRRR.T",
   "T.#WDW.#W#DW#,.#WD#.T",
   "T..N.....,...,......T",
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
    "to": "store_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 4
    }
   },
   "9,3": {
    "to": "clinic_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 9,
     "y": 4
    }
   },
   "4,9": {
    "to": "forge",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 10
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
    "x": 14,
    "y": 5,
    "dir": "down"
   },
   {
    "role": "townTip2",
    "x": 15,
    "y": 6,
    "dir": "left",
    "wander": 1
   },
   {
    "role": "forgeTip",
    "x": 5,
    "y": 10,
    "dir": "down"
   },
   {
    "role": "roamHint",
    "x": 16,
    "y": 12,
    "dir": "down"
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
   "9,15": "sign_chaoshu",
   "3,4": "sg7",
   "8,4": "sg8",
   "3,10": "sg9"
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
    "dir": "down"
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
   "T.hhhhhh.....,...ccccc.T",
   "T.#WD#W#.....,...#WD#W.T",
   "T..N.,.......,....N..,.T",
   "T,,,,,,,,,,,,,,,,,,,,,,T",
   "T..Q.,.GGGGGGGGGG...,..T",
   "T....,.GGGGGGGGGG...,..T",
   "T....,.#W#WDD#W#W...,..T",
   "T....,..NN...N.......,.T",
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
    "to": "clinic_c",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 8
    }
   },
   "19,7": {
    "to": "store_c",
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
    "role": "roamHint",
    "x": 19,
    "y": 10,
    "dir": "down"
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
   "7,15": "sign_dianji",
   "3,8": "sg10",
   "18,8": "sg11",
   "9,13": "sg30",
   "8,13": "sg12",
   "13,13": "sg13"
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
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
   "T.AA..,...~~~~..hhhh.T",
   "T.AA..,...~~~~..#WDW.T",
   "T.....,..........N...T",
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
    "to": "clinic_o",
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
   },
   {
    "role": "sparring2",
    "x": 15,
    "y": 6,
    "dir": "left"
   },
   {
    "role": "roamHint",
    "x": 3,
    "y": 12,
    "dir": "down"
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
   "10,12": "sign_tingyu",
   "17,9": "sg14"
  }
 },
 "huanan": {
  "music": "town",
  "qlv": 3,
  "theme": "t_flower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTTTT",
   "T..,.........,.....FF..T",
   "T..,hhhhhh.n.,.n..cccc.T",
   "T..,#WD#W#...,....#WDW.T",
   "T..,.N.......,.....N.,.T",
   "T..,,,,,,,,,,,,,,,,,,,.T",
   "T.FF.,...n...,...n...,.T",
   "T....,.......,.......,.T",
   "T....,.GGGGGGGGGG....,.T",
   "T....,.GGGGGGGGGG....,.T",
   "T....,.#W#WDD#W#W....,.T",
   "T....,...NN..N.......,.T",
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
    "to": "clinic_c",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 6,
     "y": 4
    }
   },
   "20,3": {
    "to": "store_c",
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
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 2,
    "gate": "need2"
   },
   "12,10": {
    "to": "yard",
    "tx": 8,
    "ty": 10,
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
    "role": "roamHint",
    "x": 18,
    "y": 6,
    "dir": "down"
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
   "9,13": "sign_huanan",
   "5,4": "sg15",
   "19,4": "sg16",
   "10,11": "sg17",
   "9,11": "sg31",
   "13,11": "sg18"
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
    "dir": "down"
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
   "T....,.hhhhhh,cccc...,.T",
   "T....,.#WD#W#,#WDW...,.T",
   "T,,,,,,,N,,,,,,N,,,,,,,T",
   "T.O..,.......,.......,.T",
   "T....,.GGGGGGGGGG....,.T",
   "T....,.GGGGGGGGGG....,.T",
   "T....,.#W#WDD#W#W....,.T",
   "T.O..,...NN..N.......,.T",
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
    "to": "clinic_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 9,
     "y": 7
    }
   },
   "16,6": {
    "to": "store_o",
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
   },
   {
    "role": "roamHint",
    "x": 19,
    "y": 8,
    "dir": "down"
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
   "7,14": "sign_beilin",
   "8,7": "sg19",
   "15,7": "sg20",
   "10,12": "sg21",
   "9,12": "sg32",
   "13,12": "sg22"
  }
 },
 "r6": {
  "music": "route",
  "qlv": 3,
  "theme": "t_spring",
  "rows": [
   "TTTTTTTTTTTTT,TTTTTTT",
   "T............i......T",
   "T.O..gggg....i.gggg.T",
   "T....gggg....i.gggg.T",
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
   },
   {
    "role": "roamHint2",
    "x": 4,
    "y": 8,
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
   "T.hhhhhh.....,..ccccT",
   "T.#WD#W#.....,..#WDWT",
   "T..N.,.......,...N..T",
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
    "to": "clinic_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 8
    }
   },
   "18,7": {
    "to": "store_o",
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
   },
   {
    "role": "roamHint",
    "x": 10,
    "y": 12,
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
   "3,13": "sign_moquan",
   "3,8": "sg23",
   "17,8": "sg24"
  }
 },
 "zhongta": {
  "music": "town",
  "qlv": 3,
  "theme": "t_tower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTT",
   "T..,..GGGGGGGG.......T",
   "T..,..GGGGGGGG.......T",
   "T..,..GGGGGGGG.......T",
   "T..,..#W#WDD#W.......T",
   "T.n,....NN,,N.....n..T",
   "T..,......,,.........T",
   "T..,=====,,,=====....T",
   "T..,......,,.........T",
   "T..hhhh...,,...cccc..T",
   "T..#WDW...,,...#WDW..T",
   "T...N.,...,,...,N....T",
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
    "to": "clinic_c",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 5,
     "y": 11
    }
   },
   "17,10": {
    "to": "store_c",
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
   },
   {
    "role": "roamHint",
    "x": 16,
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
   "18,13": "sign_zhongta2",
   "9,5": "sg25",
   "4,11": "sg27",
   "16,11": "sg28",
   "8,5": "sg33",
   "12,5": "sg26"
  }
 },
 "clinic_h": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_dawn",
  "rows": [
   "wwwwwwwwww",
   "wb_kkk__bw",
   "w________w",
   "wtttt____w",
   "w_p____p_w",
   "w________w",
   "wwww__wwww"
  ],
  "warps": [
   {
    "x": 4,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "healer",
    "x": 2,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "store_h": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_dawn",
  "rows": [
   "wwwwwwwwww",
   "wkkkk_kkkw",
   "w________w",
   "w__ttt___w",
   "w________w",
   "wp__rr__pw",
   "wwww__wwww"
  ],
  "warps": [
   {
    "x": 4,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "clerk",
    "x": 4,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "clinic_c": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_city",
  "rows": [
   "wwwwwwwwwwww",
   "wbb_kkkk__bw",
   "w__________w",
   "wtttt___tttw",
   "w_p______p_w",
   "w__________w",
   "wwwww__wwwww"
  ],
  "warps": [
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 6,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "healer",
    "x": 3,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "store_c": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_port",
  "rows": [
   "wwwwwwwwwwww",
   "wkkkkk_kkkkw",
   "w__________w",
   "w__tttt____w",
   "w____rr____w",
   "wp________pw",
   "wwwww__wwwww"
  ],
  "warps": [
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 6,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "clerk",
    "x": 5,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "clinic_o": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_stele",
  "rows": [
   "wwwwwwwwww",
   "wb_ttt__bw",
   "w________w",
   "wk_____k_w",
   "w_p____p_w",
   "w________w",
   "wwww__wwww"
  ],
  "warps": [
   {
    "x": 4,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "healer",
    "x": 2,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "store_o": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_stele",
  "rows": [
   "wwwwwwwwww",
   "wkk_kk_kkw",
   "w________w",
   "w_tt__tt_w",
   "w___rr___w",
   "wp______pw",
   "wwww__wwww"
  ],
  "warps": [
   {
    "x": 4,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "clerk",
    "x": 4,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "forge": {
  "music": "town",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_alley",
  "rows": [
   "wwwwwwwwwwww",
   "wkk_ttt__kkw",
   "w__________w",
   "w_t_____t__w",
   "w__r____r__w",
   "wp________pw",
   "wwwww__wwwww"
  ],
  "warps": [
   {
    "x": 5,
    "y": 6,
    "to": "@ret"
   },
   {
    "x": 6,
    "y": 6,
    "to": "@ret"
   }
  ],
  "npcs": [
   {
    "role": "smith",
    "x": 5,
    "y": 2,
    "dir": "down"
   }
  ]
 },
 "c1a": {
  "music": "hall",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_slope",
  "rows": [
   "wwwwBBBBBBww",
   "w__________w",
   "w_tt_rr_tt_w",
   "w__________w",
   "w_tt_rr_tt_w",
   "w__________w",
   "wp_tt__tt_pw",
   "w__________w",
   "wwwww__wwwww"
  ],
  "warps": [
   {
    "x": 5,
    "y": 8,
    "to": "zhuyin",
    "tx": 12,
    "ty": 12,
    "dir": "down"
   },
   {
    "x": 6,
    "y": 8,
    "to": "zhuyin",
    "tx": 13,
    "ty": 12,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "boss1",
    "x": 5,
    "y": 1,
    "dir": "down"
   },
   {
    "role": "c1aTip",
    "x": 2,
    "y": 5,
    "dir": "right"
   }
  ],
  "chests": [
   {
    "id": "c1a1",
    "x": 10,
    "y": 7,
    "items": {
     "heal": 2,
     "hint": 1
    }
   }
  ],
  "devices": {
   "4,0": {
    "group": "bb",
    "flag": "bb1",
    "cat": "字形",
    "label": "錯字黑板",
    "text": "黑板上浮著扭曲的錯字，正一個個滴下黑墨……\\n（找出正確的寫法，就能淨化它！）",
    "ok": "錯字被擦掉了，黑板恢復了乾淨！",
    "allText": "三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。"
   },
   "6,0": {
    "group": "bb",
    "flag": "bb2",
    "cat": "字形",
    "label": "錯字黑板",
    "text": "第二塊黑板上的錯字正在發抖。",
    "ok": "錯字被擦掉了！",
    "allText": "三塊黑板都被淨化了！"
   },
   "8,0": {
    "group": "bb",
    "flag": "bb3",
    "cat": "字形",
    "label": "錯字黑板",
    "text": "最後一塊黑板寫滿了形近字。",
    "ok": "錯字被擦掉了！",
    "allText": "三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。",
    "onAll": "bbAll"
   }
  }
 },
 "lib": {
  "music": "hall",
  "qlv": 2,
  "indoor": 1,
  "theme": "t_port",
  "rows": [
   "wwwwwwwwwwwwwwww",
   "wkk____t_____kkw",
   "wkkkkkkkkkkkkkkw",
   "w_QQ__k__kk_QQ_w",
   "w____k______k__w",
   "wQQ__k_kkkk_k_Qw",
   "w____k____k____w",
   "w_kkkk_kk_kkkk_w",
   "w__QQ______QQ__w",
   "wp____kkkk____pw",
   "w______________w",
   "wwwwwww__wwwwwww"
  ],
  "warps": [
   {
    "x": 7,
    "y": 11,
    "to": "dianji",
    "tx": 11,
    "ty": 13,
    "dir": "down"
   },
   {
    "x": 8,
    "y": 11,
    "to": "dianji",
    "tx": 12,
    "ty": 13,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "boss2",
    "x": 8,
    "y": 1,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "lib1",
    "x": 1,
    "y": 10,
    "items": {
     "hint": 2,
     "dodgeup": 1
    },
    "frags": {
     "tome": 2
    }
   }
  ],
  "devices": {
   "2,3": {
    "group": "bk",
    "flag": "bk1",
    "cat": "成語",
    "label": "飛舞的成語辭典",
    "text": "一本成語辭典在書箱上飛來飛去，書頁上缺了一個字……",
    "ok": "辭典安靜地飛回了書架！",
    "allText": "三本辭典都歸位了——中央的書架緩緩讓開，露出通往股長的路！",
    "open": [
     [
      7,
      2
     ],
     [
      8,
      2
     ]
    ]
   },
   "11,3": {
    "group": "bk",
    "flag": "bk2",
    "cat": "成語",
    "label": "飛舞的成語辭典",
    "text": "第二本辭典在你頭上盤旋。",
    "ok": "辭典飛回了書架！",
    "allText": "三本辭典都歸位了！",
    "open": [
     [
      7,
      2
     ],
     [
      8,
      2
     ]
    ]
   },
   "7,7": {
    "group": "bk",
    "flag": "bk3",
    "cat": "成語",
    "label": "飛舞的成語辭典",
    "text": "最後一本辭典夾在書箱縫隙中。",
    "ok": "辭典回到了原位！",
    "allText": "三本辭典都歸位了——中央的書架緩緩讓開！",
    "open": [
     [
      7,
      2
     ],
     [
      8,
      2
     ]
    ],
    "onAll": "bkAll"
   }
  }
 },
 "yard": {
  "music": "hall",
  "qlv": 2,
  "indoor": 1,
  "theme": "t_flower",
  "rows": [
   "wwwwwwwwwwwwwwww",
   "w____t____t____w",
   "w_FF________FF_w",
   "w______rr______w",
   "w_~~~__rr__~~~_w",
   "w_~~~__rr__~~~_w",
   "w______rr______w",
   "w_FF___rr___FF_w",
   "w______rr______w",
   "wp____A__A____pw",
   "w______________w",
   "wwwwwww__wwwwwww"
  ],
  "warps": [
   {
    "x": 7,
    "y": 11,
    "to": "huanan",
    "tx": 11,
    "ty": 11,
    "dir": "down"
   },
   {
    "x": 8,
    "y": 11,
    "to": "huanan",
    "tx": 12,
    "ty": 11,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "boss3",
    "x": 7,
    "y": 1,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "yard1",
    "x": 14,
    "y": 10,
    "items": {
     "heal2": 1,
     "cure": 1
    }
   }
  ],
  "devices": {
   "2,2": {
    "group": "fl",
    "flag": "fl1",
    "cat": "修辭",
    "label": "枯萎的花",
    "text": "一盆花因為墨塵而低著頭。\\n（用心感受文字，也許它會重新綻放。）",
    "ok": "花瓣舒展開來，散發出淡淡的香氣！",
    "allText": "三盆花都開了，花室恢復了生氣——助教的氣勢也弱了下來。"
   },
   "13,2": {
    "group": "fl",
    "flag": "fl2",
    "cat": "閱讀",
    "label": "枯萎的花",
    "text": "第二盆花的葉子上積了一層黑墨。",
    "ok": "黑墨散去，花開了！",
    "allText": "三盆花都開了！"
   },
   "2,7": {
    "group": "fl",
    "flag": "fl3",
    "cat": "修辭",
    "label": "枯萎的花",
    "text": "最後一盆花只剩下花苞。",
    "ok": "花苞綻放了！",
    "allText": "三盆花都開了，花室恢復了生氣！",
    "onAll": "flAll"
   }
  }
 },
 "hist": {
  "music": "hall",
  "qlv": 3,
  "indoor": 1,
  "theme": "t_stele",
  "rows": [
   "wwwwwwwwwwwwww",
   "wkk___t____kkw",
   "w____________w",
   "wkkk_kkkk_kkkw",
   "w____________w",
   "w_p________p_w",
   "wwwwwMMMMwwwww",
   "w____________w",
   "wk__OO__OO__kw",
   "w____________w",
   "w____________w",
   "wwwwww__wwwwww"
  ],
  "warps": [
   {
    "x": 6,
    "y": 11,
    "to": "beilin",
    "tx": 11,
    "ty": 12,
    "dir": "down"
   },
   {
    "x": 7,
    "y": 11,
    "to": "beilin",
    "tx": 12,
    "ty": 12,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "boss4",
    "x": 7,
    "y": 1,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "hist1",
    "x": 1,
    "y": 10,
    "items": {
     "heal2": 2,
     "atkup": 1
    },
    "frags": {
     "classic": 2
    }
   }
  ],
  "devices": {
   "5,6": {
    "group": "st",
    "flag": "st1",
    "cat": "文言",
    "label": "古文石碑",
    "text": "石碑上刻著一段古文，字跡被墨塵遮住了一半……\\n（讀懂它，石碑就會亮起。）",
    "ok": "石碑亮起了柔和的光！",
    "allText": "三座石碑同時亮起，擋路的石碑緩緩沉入地面，通往檔案室的路開了！",
    "open": [
     [
      5,
      6
     ],
     [
      6,
      6
     ],
     [
      7,
      6
     ],
     [
      8,
      6
     ]
    ]
   },
   "6,6": {
    "group": "st",
    "flag": "st2",
    "cat": "文言",
    "label": "古文石碑",
    "text": "第二座石碑記載著校史與古語。",
    "ok": "石碑亮起來了！",
    "allText": "三座石碑同時亮起，路開了！",
    "open": [
     [
      5,
      6
     ],
     [
      6,
      6
     ],
     [
      7,
      6
     ],
     [
      8,
      6
     ]
    ]
   },
   "7,6": {
    "group": "st",
    "flag": "st3",
    "cat": "常識",
    "label": "古文石碑",
    "text": "最後一座石碑上是一段國學常識。",
    "ok": "石碑亮起來了！",
    "allText": "三座石碑同時亮起，路開了！",
    "open": [
     [
      5,
      6
     ],
     [
      6,
      6
     ],
     [
      7,
      6
     ],
     [
      8,
      6
     ]
    ],
    "onAll": "stAll"
   }
  }
 },
 "aud": {
  "music": "hall",
  "qlv": 3,
  "indoor": 1,
  "theme": "t_tower",
  "rows": [
   "wwwwwBBBBBBwwwww",
   "w______________w",
   "wtttttt__ttttttw",
   "w______rr______w",
   "w_tt_V_rr_t_tt_w",
   "w______rr______w",
   "w_tt_t_rr_t_tt_w",
   "w______rr______w",
   "w_tt_t_rr_V_tt_w",
   "w______rr______w",
   "wV_t_t_rr_t_tt_w",
   "w______rr______w",
   "wwwwwww__wwwwwww"
  ],
  "warps": [
   {
    "x": 7,
    "y": 12,
    "to": "zhongta",
    "tx": 10,
    "ty": 5,
    "dir": "down"
   },
   {
    "x": 8,
    "y": 12,
    "to": "zhongta",
    "tx": 11,
    "ty": 5,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "e1",
    "x": 1,
    "y": 9,
    "dir": "right",
    "sight": 14
   },
   {
    "role": "e2",
    "x": 14,
    "y": 7,
    "dir": "left",
    "sight": 14
   },
   {
    "role": "e3",
    "x": 1,
    "y": 5,
    "dir": "right",
    "sight": 14
   },
   {
    "role": "moGuard",
    "x": 4,
    "y": 11,
    "dir": "right"
   },
   {
    "role": "boss5",
    "x": 7,
    "y": 1,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "aud1",
    "x": 1,
    "y": 1,
    "items": {
     "heal2": 2,
     "cure": 2,
     "dodgeup": 1
    }
   },
   {
    "id": "aud2",
    "x": 14,
    "y": 1,
    "items": {
     "atkup": 2,
     "defup": 2
    }
   }
  ],
  "devices": {
   "5,4": {
    "group": "ad",
    "flag": "ad1",
    "cat": "閱讀",
    "label": "准考證感應台",
    "text": "講台前的感應台亮著微光，上面寫著：「答對即可凝聚文氣。」",
    "ok": "感應台亮起，一股文氣湧入你的身體！（下場戰鬥文氣 +1）"
   },
   "10,8": {
    "group": "ad",
    "flag": "ad2",
    "cat": "成語",
    "label": "准考證感應台",
    "text": "第二座感應台等著你。",
    "ok": "文氣再度凝聚！（下場戰鬥文氣 +1）"
   },
   "1,10": {
    "group": "ad",
    "flag": "ad3",
    "cat": "文言",
    "label": "准考證感應台",
    "text": "最後一座感應台散發著沉穩的光。",
    "ok": "文氣滿溢！（下場戰鬥文氣 +1）",
    "allText": "三座感應台全部亮起，整座禮堂被文氣照亮了！"
   }
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
for (const [k, w] of Object.entries(INTERIOR_LINKS)) if (LAYOUTS[k] && !NEW_MAPS[k]) LAYOUTS[k].warps = w;
/* 道館室內不再需要舊的關卡限制 */
for (const k of ['c1a', 'lib', 'yard', 'hist', 'aud']) if (LAYOUTS[k]) { delete LAYOUTS[k].gates; delete LAYOUTS[k].doorWarps; }
for (const k of ['clinic', 'store']) delete LAYOUTS[k];      // 改用各城鎮風格的室內
