'use strict';
/* 城鎮與道館重畫草案（未接進遊戲）*/
const DRAFT3 = {
 "chendu": {
  "music": "town",
  "qlv": 1,
  "theme": "t_dawn",
  "rows": [
   "TTTTTTTTTTTTTTTTTTTTTT",
   "TJJJ..#####.#####....T",
   "TJJJ..#####.#####....T",
   "TJJJ..#####.#####..F.T",
   "TJJJ..##D##.##D##....T",
   "TJJJ..,,,,,.,,,,,....T",
   "T..,,,,,,,,,,,,,,,,,.T",
   "T..,...F.........,...T",
   "T..,..#####..#####,..T",
   "T..,..#####..#####,..T",
   "T..,..#####..#####,..T",
   "T..,..##D##..##D##,..T",
   "T..,..,,,,,..,,,,,,..T",
   "T..,,,,,,,,,,,,,,,,,.T",
   "TJJ..AA,......S......T",
   "TJJ====,====....F....T",
   "TTTTTTT,TTTTTTTTTTTTTT"
  ],
  "warps": [
   {
    "x": 7,
    "y": 16,
    "to": "r1",
    "tx": 7,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "8,4": {
    "to": "clinic_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 8,
     "y": 5
    }
   },
   "14,4": {
    "to": "home",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 14,
     "y": 5
    }
   },
   "8,11": {
    "to": "store_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 8,
     "y": 12
    }
   },
   "15,11": {
    "to": "c8",
    "tx": 5,
    "ty": 7,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 12
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
    "x": 7,
    "y": 6,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "cd1",
    "x": 4,
    "y": 13,
    "items": {
     "heal": 2
    }
   }
  ],
  "signs": {
   "9,4": "sign_chendu",
   "15,4": "sg0",
   "9,11": "sg1",
   "16,11": "sg2",
   "5,14": "sg3"
  },
  "props": [
   [
    "clinic",
    6,
    1
   ],
   [
    "house",
    12,
    1
   ],
   [
    "store",
    6,
    8
   ],
   [
    "house",
    13,
    8
   ]
  ]
 },
 "zhuyin": {
  "music": "town",
  "qlv": 1,
  "theme": "t_slope",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTTTT",
   "T..,..........KKKK.....T",
   "T..,..#####...KKKK.....T",
   "T..,..#####...KKKK.....T",
   "T..,..#####............T",
   "T..,..##D##......#####.T",
   "T..,,,,,,,,,,,,,,#####.T",
   "T..i.....,.......#####.T",
   "TUUU.....,.......#####.T",
   "TUUU..######...........T",
   "T.....######....,,,,,,.T",
   "T.....######....,......T",
   "T.....######....,......T",
   "T.....##DD##....,......T",
   "T.....,,,,,,,,,,,......T",
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
    "y": 16,
    "to": "r2",
    "tx": 12,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "8,5": {
    "to": "clinic_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 8,
     "y": 6
    }
   },
   "8,13": {
    "to": "c1a",
    "tx": 5,
    "ty": 7,
    "dir": "up",
    "ret": {
     "x": 8,
     "y": 14
    }
   },
   "9,13": {
    "to": "c1a",
    "tx": 5,
    "ty": 7,
    "dir": "up",
    "ret": {
     "x": 9,
     "y": 14
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
    "x": 4,
    "y": 8,
    "dir": "down"
   },
   {
    "role": "gymTip1",
    "x": 12,
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
   "9,5": "sign_zhuyin",
   "10,13": "sg4",
   "14,1": "sg29",
   "15,1": "sg5",
   "16,1": "sg6"
  },
  "props": [
   [
    "clinic",
    6,
    2
   ],
   [
    "house",
    17,
    5
   ],
   [
    "gym",
    6,
    9
   ]
  ]
 },
 "chaoshu": {
  "music": "town",
  "qlv": 2,
  "theme": "t_alley",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTT",
   "T................,...T",
   "T.#####..#####.I,,,,.T",
   "T.#####..#####..,....T",
   "T.#####..#####..,....T",
   "T.#####..##D##..,....T",
   "T.,,,,,,,,,,,,,,,,,,.T",
   "T.,....m....m...,....T",
   "T.#####..#####..,....T",
   "T.#####..#####..,....T",
   "T.#####..#####..,....T",
   "T.##D##..#####..,....T",
   "T.,,,,,,,,,,,,,,,,,,.T",
   "T.,...L....m....,....T",
   "T.#####.#####...,....T",
   "T.#####.#####...,....T",
   "T.#####.#####...,....T",
   "T.##D##.#####...,....T",
   "T.,,,,,,,,,,,,,,,,,,.T",
   "TTTTTTTTTTTTT,TTTTTTTT"
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
    "y": 19,
    "to": "r3",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "11,5": {
    "to": "forge",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 11,
     "y": 6
    }
   },
   "4,11": {
    "to": "clinic_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 12
    }
   },
   "4,17": {
    "to": "store_h",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 18
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
    "y": 12,
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
   "12,5": "sign_chaoshu",
   "5,11": "sg7",
   "5,17": "sg8",
   "15,2": "sg9"
  },
  "props": [
   [
    "house",
    2,
    2
   ],
   [
    "house",
    9,
    2
   ],
   [
    "clinic",
    2,
    8
   ],
   [
    "house",
    9,
    8
   ],
   [
    "store",
    2,
    14
   ],
   [
    "house",
    8,
    14
   ]
  ]
 },
 "dianji": {
  "music": "town",
  "qlv": 2,
  "theme": "t_port",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTTTT",
   "T~~~~~~..........,.....T",
   "T~~~~~~..........,.....T",
   "T~~~PP...........,.....T",
   "T...,,,,,,,,,,,,,,,,,,.T",
   "T...,.....,.......,....T",
   "T.#####.......#####....T",
   "T.#####.......#####....T",
   "T.#####.......#####....T",
   "T.##D##.......##D##....T",
   "T..,,,,,,,,,,,,,,,,,,..T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......##DD##.........T",
   "T.......,,,,,,.........T",
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
    "y": 17,
    "to": "r4",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "4,9": {
    "to": "clinic_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 10
    }
   },
   "16,9": {
    "to": "store_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 16,
     "y": 10
    }
   },
   "10,15": {
    "to": "lib",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 1,
    "gate": "need1",
    "ret": {
     "x": 10,
     "y": 16
    }
   },
   "11,15": {
    "to": "lib",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 1,
    "gate": "need1",
    "ret": {
     "x": 11,
     "y": 16
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
    "x": 7,
    "y": 9,
    "dir": "down"
   },
   {
    "role": "rival1",
    "x": 14,
    "y": 14,
    "dir": "up",
    "sight": 3
   },
   {
    "role": "gymTip2",
    "x": 10,
    "y": 10,
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
   "5,9": "sign_dianji",
   "17,9": "sg10",
   "12,15": "sg11",
   "4,3": "sg30",
   "5,3": "sg12"
  },
  "props": [
   [
    "clinic",
    2,
    6
   ],
   [
    "store",
    14,
    6
   ],
   [
    "gym",
    8,
    11
   ]
  ]
 },
 "tingyu": {
  "music": "town",
  "qlv": 2,
  "theme": "t_bamboo",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTT",
   "T...............,,...T",
   "T.#####.........,....T",
   "T.#####...AA....,....T",
   "T.#####...AA....,....T",
   "T.#####.........,....T",
   "T.,,,,,,,,,,,,,,,,...T",
   "T.,...~~~~~.....,....T",
   "T.,...~~~~~..#####...T",
   "T.,...~~~~~..#####...T",
   "T.,..........#####...T",
   "T.,,,,,,,,,,,##D##...T",
   "T.....F......,,,,,...T",
   "T........S...........T",
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
   "15,11": {
    "to": "clinic_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 12
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
    "y": 6,
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
   "16,11": "sign_tingyu",
   "10,3": "sg14"
  },
  "props": [
   [
    "house",
    2,
    2
   ],
   [
    "clinic",
    13,
    8
   ]
  ]
 },
 "huanan": {
  "music": "town",
  "qlv": 3,
  "theme": "t_flower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTTTT",
   "T..,...F.......F.......T",
   "T..,.#####....#####....T",
   "T..,.#####....#####....T",
   "T..,.#####....#####....T",
   "T..,.##D##....##D##....T",
   "T..,,,,,,,,,,,,,,,,,,,.T",
   "T..,..F.....F......F...T",
   "T..,.#####......#####..T",
   "T..,.#####......#####..T",
   "T..,.#####......#####..T",
   "T..,.#####......#####..T",
   "T..,,,,,,,,,,,,,,,,,,,.T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......##DD##.........T",
   "T.......,,,,,,.........T",
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
    "y": 19,
    "to": "r5",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "7,5": {
    "to": "clinic_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 7,
     "y": 6
    }
   },
   "16,5": {
    "to": "store_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 16,
     "y": 6
    }
   },
   "10,17": {
    "to": "yard",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 2,
    "gate": "need2",
    "ret": {
     "x": 10,
     "y": 18
    }
   },
   "11,17": {
    "to": "yard",
    "tx": 7,
    "ty": 10,
    "dir": "up",
    "need": 2,
    "gate": "need2",
    "ret": {
     "x": 11,
     "y": 18
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
    "x": 4,
    "y": 18,
    "dir": "down"
   },
   {
    "role": "gymTip3",
    "x": 12,
    "y": 18,
    "dir": "down"
   },
   {
    "role": "roamHint",
    "x": 18,
    "y": 7,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "hn1",
    "x": 21,
    "y": 18,
    "items": {
     "dodgeup": 1,
     "heal2": 1
    }
   }
  ],
  "signs": {
   "8,5": "sign_huanan",
   "17,5": "sg15",
   "12,17": "sg16"
  },
  "props": [
   [
    "clinic",
    5,
    2
   ],
   [
    "store",
    14,
    2
   ],
   [
    "house",
    5,
    8
   ],
   [
    "house",
    16,
    8
   ],
   [
    "gym",
    8,
    13
   ]
  ]
 },
 "beilin": {
  "music": "town",
  "qlv": 3,
  "theme": "t_stele",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTTTT",
   "T................,.....T",
   "T.#####..........,.....T",
   "T.#####..........,.....T",
   "T.#####..........,.....T",
   "T.##D##..........,.....T",
   "T.,,,,,,,,,,,,,,,,,,,,.T",
   "T.,.....OO...OO...,....T",
   "T.#####......#####.....T",
   "T.#####......#####.....T",
   "T.#####......#####.....T",
   "T.#####......##D##.....T",
   "T.,,,,,,,,,,,,,,,,,,,,.T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......######.........T",
   "T.......##DD##.........T",
   "T.......,,,,,,.........T",
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
    "y": 19,
    "to": "r6",
    "tx": 13,
    "ty": 1,
    "dir": "down"
   }
  ],
  "doorWarps": {
   "4,5": {
    "to": "clinic_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 6
    }
   },
   "15,11": {
    "to": "store_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 12
    }
   },
   "10,17": {
    "to": "hist",
    "tx": 6,
    "ty": 10,
    "dir": "up",
    "need": 3,
    "gate": "need3",
    "ret": {
     "x": 10,
     "y": 18
    }
   },
   "11,17": {
    "to": "hist",
    "tx": 6,
    "ty": 10,
    "dir": "up",
    "need": 3,
    "gate": "need3",
    "ret": {
     "x": 11,
     "y": 18
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
    "x": 7,
    "y": 10,
    "dir": "down"
   },
   {
    "role": "gymTip4",
    "x": 12,
    "y": 18,
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
    "y": 10,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "bl1",
    "x": 2,
    "y": 17,
    "items": {
     "heal2": 2,
     "cure": 2
    }
   }
  ],
  "signs": {
   "5,5": "sign_beilin",
   "16,11": "sg19",
   "12,17": "sg20",
   "8,7": "sg21",
   "9,7": "sg32",
   "13,7": "sg22"
  },
  "props": [
   [
    "clinic",
    2,
    2
   ],
   [
    "house",
    2,
    8
   ],
   [
    "store",
    13,
    8
   ],
   [
    "gym",
    8,
    13
   ]
  ]
 },
 "moquan": {
  "music": "town",
  "qlv": 3,
  "theme": "t_spring",
  "rows": [
   "TTTTTTTTTTTTTTTTT,TTTT",
   "T...............,,...T",
   "T.#####.........,....T",
   "T.#####.........,....T",
   "T.#####.........,....T",
   "T.##D##.........,....T",
   "T.,,,,,,,,,,,,,,,,,..T",
   "T.,....~~~~~....,....T",
   "T.,....~~~~~.#####...T",
   "T.,....~~~~~.#####...T",
   "T.,..........#####...T",
   "T.,,,,,,,,,,,##D##...T",
   "T....###.....,,,,,...T",
   "T....###.............T",
   "T....#D#.............T",
   "T....................T",
   "TTTTTTTTTTTTTTTTTTTTTT"
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
   "4,5": {
    "to": "clinic_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 6
    }
   },
   "15,11": {
    "to": "store_o",
    "tx": 4,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 15,
     "y": 12
    }
   },
   "6,14": {
    "to": "inkpool",
    "tx": 8,
    "ty": 12,
    "dir": "up",
    "ret": {
     "x": 6,
     "y": 15
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
    "x": 14,
    "y": 12,
    "dir": "left"
   },
   {
    "role": "ngHint",
    "x": 10,
    "y": 10,
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
   "5,5": "sign_moquan",
   "16,11": "sg23",
   "7,14": "sg24"
  },
  "props": [
   [
    "clinic",
    2,
    2
   ],
   [
    "store",
    13,
    8
   ],
   [
    "shrine",
    5,
    12
   ]
  ]
 },
 "zhongta": {
  "music": "town",
  "qlv": 3,
  "theme": "t_tower",
  "rows": [
   "TTT,TTTTTTTTTTTTTTTTTT",
   "T..,.................T",
   "T..,....######.......T",
   "T..,....######.......T",
   "T..,....######.......T",
   "T..,....######.......T",
   "T..,....######.......T",
   "T..,....######.......T",
   "T..,....##DD##.......T",
   "T..,,,,,,,,,,,,,,,,,.T",
   "T..,.................T",
   "T.#####.....#####....T",
   "T.#####.....#####....T",
   "T.#####.....#####....T",
   "T.##D##.....##D##....T",
   "T.,,,,,,,,,,,,,,,,,,.T",
   "T........S...........T",
   "T....................T",
   "T....................T",
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
   "10,8": {
    "to": "aud",
    "tx": 7,
    "ty": 11,
    "dir": "up",
    "need": 4,
    "gate": "need4",
    "ret": {
     "x": 10,
     "y": 9
    }
   },
   "11,8": {
    "to": "aud",
    "tx": 7,
    "ty": 11,
    "dir": "up",
    "need": 4,
    "gate": "need4",
    "ret": {
     "x": 11,
     "y": 9
    }
   },
   "4,14": {
    "to": "clinic_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 4,
     "y": 15
    }
   },
   "14,14": {
    "to": "store_c",
    "tx": 5,
    "ty": 5,
    "dir": "up",
    "ret": {
     "x": 14,
     "y": 15
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
    "y": 18,
    "dir": "down"
   },
   {
    "role": "gymTip5",
    "x": 9,
    "y": 9,
    "dir": "down"
   },
   {
    "role": "roamHint",
    "x": 16,
    "y": 7,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "zt1",
    "x": 2,
    "y": 17,
    "items": {
     "heal2": 3,
     "cure": 2
    }
   }
  ],
  "signs": {
   "12,8": "sign_zhongta",
   "5,14": "sign_zhongta2",
   "15,14": "sg25",
   "9,16": "sg27"
  },
  "props": [
   [
    "tower",
    8,
    2
   ],
   [
    "clinic",
    2,
    11
   ],
   [
    "store",
    12,
    11
   ]
  ]
 },
 "c1a": {
  "music": "hall",
  "qlv": 1,
  "indoor": 1,
  "theme": "t_slope",
  "rows": [
   "wwwBBBBBBwww",
   "w_x__e____xw",
   "w__________w",
   "w_tt_tt_tt_w",
   "w__________w",
   "w_tt_tt_tt_w",
   "wp________pw",
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
    "x": 6,
    "y": 1,
    "dir": "down"
   },
   {
    "role": "c1aTip",
    "x": 2,
    "y": 4,
    "dir": "right"
   },
   {
    "role": "gy1a",
    "x": 1,
    "y": 3,
    "dir": "right",
    "sight": 5
   },
   {
    "role": "gy1b",
    "x": 9,
    "y": 6,
    "dir": "left",
    "sight": 5
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
   "3,0": {
    "group": "bb",
    "flag": "bb1",
    "cat": "字形",
    "label": "錯字黑板",
    "text": "黑板上浮著扭曲的錯字，正一個個滴下黑墨……\\n（找出正確的寫法，就能淨化它！）",
    "ok": "錯字被擦掉了，黑板恢復了乾淨！",
    "allText": "三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。"
   },
   "4,0": {
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
   "wx__k__e___k__xw",
   "wkkkkkk__kkkkkkw",
   "w_QQ__k__kk_QQ_w",
   "w____k______k__w",
   "wQQ__k_kkkk_k_Qw",
   "w____k____k____w",
   "w_kkkk_kk_kkkk_w",
   "w__QQ__p___QQ__w",
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
   },
   {
    "role": "gy2a",
    "x": 3,
    "y": 4,
    "dir": "down",
    "sight": 5
   },
   {
    "role": "gy2b",
    "x": 12,
    "y": 6,
    "dir": "left",
    "sight": 5
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
   "10,3": {
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
   "8,7": {
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
   "w__x__e__x_____w",
   "w_FF________FF_w",
   "w_~~~__rr__~~~_w",
   "w_~~~__rr__~~~_w",
   "w_A____rr____A_w",
   "w______rr______w",
   "w_FF___rr___FF_w",
   "w_~~~__rr__~~~_w",
   "wp_____rr_____pw",
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
   },
   {
    "role": "gy3a",
    "x": 3,
    "y": 6,
    "dir": "right",
    "sight": 5
   },
   {
    "role": "gy3b",
    "x": 11,
    "y": 5,
    "dir": "left",
    "sight": 5
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
   "2,5": {
    "group": "fl",
    "flag": "fl1",
    "cat": "修辭",
    "label": "枯萎的花",
    "text": "一盆花因為墨塵而低著頭。\\n（用心感受文字，也許它會重新綻放。）",
    "ok": "花瓣舒展開來，散發出淡淡的香氣！",
    "allText": "三盆花都開了，花室恢復了生氣——助教的氣勢也弱了下來。"
   },
   "13,5": {
    "group": "fl",
    "flag": "fl2",
    "cat": "閱讀",
    "label": "枯萎的花",
    "text": "第二盆花的葉子上積了一層黑墨。",
    "ok": "黑墨散去，花開了！",
    "allText": "三盆花都開了！"
   },
   "1,9": {
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
   "wkk__e__x__kkw",
   "w____________w",
   "wkkk_kkkk_kkkw",
   "w____________w",
   "w_p________p_w",
   "wwwwwMMM_wwwww",
   "w____________w",
   "w_OO__OO__OO_w",
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
    "x": 6,
    "y": 1,
    "dir": "down"
   },
   {
    "role": "gy4a",
    "x": 2,
    "y": 4,
    "dir": "right",
    "sight": 5
   },
   {
    "role": "gy4b",
    "x": 10,
    "y": 7,
    "dir": "left",
    "sight": 5
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
   "wx____________xw",
   "we____________ew",
   "wtttttt_tttttttw",
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
    "y": 13,
    "to": "zhongta",
    "tx": 10,
    "ty": 7,
    "dir": "down"
   },
   {
    "x": 8,
    "y": 13,
    "to": "zhongta",
    "tx": 11,
    "ty": 7,
    "dir": "down"
   }
  ],
  "npcs": [
   {
    "role": "e1",
    "x": 4,
    "y": 1,
    "dir": "down",
    "sight": 14
   },
   {
    "role": "e2",
    "x": 7,
    "y": 1,
    "dir": "down",
    "sight": 14
   },
   {
    "role": "e3",
    "x": 10,
    "y": 1,
    "dir": "down",
    "sight": 14
   },
   {
    "role": "moGuard",
    "x": 8,
    "y": 4,
    "dir": "left"
   },
   {
    "role": "boss5",
    "x": 7,
    "y": 2,
    "dir": "down",
    "after": [
     "aud:e1",
     "aud:e2",
     "aud:e3"
    ],
    "cut": "bossDrop"
   },
   {
    "role": "gy5a",
    "x": 3,
    "y": 6,
    "dir": "right",
    "sight": 5
   },
   {
    "role": "gy5b",
    "x": 11,
    "y": 8,
    "dir": "left",
    "sight": 5
   }
  ],
  "chests": [
   {
    "id": "aud1",
    "x": 2,
    "y": 2,
    "items": {
     "heal2": 2,
     "cure": 2,
     "dodgeup": 1
    }
   },
   {
    "id": "aud2",
    "x": 13,
    "y": 2,
    "items": {
     "atkup": 2,
     "defup": 2
    }
   }
  ],
  "devices": {
   "5,5": {
    "group": "ad",
    "flag": "ad1",
    "cat": "閱讀",
    "label": "准考證感應台",
    "text": "講台前的感應台亮著微光，上面寫著：「答對即可凝聚文氣。」",
    "ok": "感應台亮起，一股文氣湧入你的身體！（下場戰鬥文氣 +1）"
   },
   "10,9": {
    "group": "ad",
    "flag": "ad2",
    "cat": "成語",
    "label": "准考證感應台",
    "text": "第二座感應台等著你。",
    "ok": "文氣再度凝聚！（下場戰鬥文氣 +1）"
   },
   "1,11": {
    "group": "ad",
    "flag": "ad3",
    "cat": "文言",
    "label": "准考證感應台",
    "text": "最後一座感應台散發著沉穩的光。",
    "ok": "文氣滿溢！（下場戰鬥文氣 +1）",
    "allText": "三座感應台全部亮起，整座禮堂被文氣照亮了！"
   }
  }
 },
 "inkpool": {
  "music": "boss",
  "qlv": 3,
  "indoor": 1,
  "theme": "t_ink",
  "rows": [
   "XXXXXXXXXXXXXXXXXX",
   "X,,,,,,,,,,,,,,,,X",
   "X,OO,,,,,,,,,,OO,X",
   "X,OO,~~~~~~~~,OO,X",
   "X,,,~~~~~~~~~~,,,X",
   "X,~~~~~,q,~~~~~~,X",
   "X,~~~~~,,,~~~~~~,X",
   "X,~~~~~,,,~~~~~~,X",
   "X,~~~~~,,,~~~~~~,X",
   "X,,,~~~,,,~~~~,,,X",
   "X,AA,,,,,,,,,,AA,X",
   "X,,,,,,,,,,,,,,,,X",
   "X,,,,,,,,,,,,,,,,X",
   "XXXXXXXX,,XXXXXXXX"
  ],
  "warps": [
   {
    "x": 8,
    "y": 13,
    "to": "moquan",
    "tx": 6,
    "ty": 13,
    "dir": "down"
   },
   {
    "x": 9,
    "y": 13,
    "to": "moquan",
    "tx": 6,
    "ty": 13,
    "dir": "down"
   }
  ],
  "chests": [
   {
    "id": "ink1",
    "x": 1,
    "y": 1,
    "items": {
     "heal2": 3,
     "ward": 2,
     "cure": 2
    }
   },
   {
    "id": "ink2",
    "x": 16,
    "y": 12,
    "items": {
     "atkup": 2,
     "defup": 2,
     "dodgeup": 1
    }
   }
  ],
  "npcs": [],
  "devices": {
   "2,2": {
    "group": "sh",
    "flag": "sh1",
    "cat": "詩詞",
    "label": "文心筆碎片",
    "text": "石碑下嵌著一塊發亮的碎片，形狀像一支斷掉的筆尖。碑上刻著一道題。",
    "ok": "碎片浮起來，化成一點白光鑽進你的行囊。（文心筆碎片 ×1）"
   },
   "15,2": {
    "group": "sh",
    "flag": "sh2",
    "cat": "閱讀",
    "label": "素心紙碎片",
    "text": "另一塊碑前飄著一片沒寫完的紙。你伸手一碰，紙上浮出一段文章。",
    "ok": "紙片捲成一道光，跟著你走了。（素心紙碎片 ×1）"
   },
   "2,10": {
    "group": "sh",
    "flag": "sh3",
    "cat": "文言",
    "label": "凝香墨碎片",
    "text": "涼亭的石桌上有一滴凝住的墨，墨裡映出幾行古文。",
    "ok": "墨滴散開，化成香氣繞在你身邊。（凝香墨碎片 ×1）",
    "allText": "三塊碎片同時亮起，整座墨池的水面開始倒轉！",
    "onAll": "shardsAll"
   }
  }
 }
};
