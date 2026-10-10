/**
 * 輕鬆學發音 / 愈廣愈準 — 課程內容
 * 粵拼（Jyutping）+ 情景對話 + 錄音測驗句子
 */
window.APP_DATA = {
  appName: "輕鬆學發音",
  appSubtitle: "愈廣愈準",
  school: "QESOSA 湯國華中學",
  version: "2.0.0",

  tips: [
    {
      title: "聽多啲、講多啲",
      body: "每日用 10–15 分鐘聽廣東話（新聞、卡通、課堂用語），跟住輕聲複述。唔使一次學晒，慢慢來就得。"
    },
    {
      title: "聲調好重要",
      body: "廣東話有 6 個聲調，同一個音唔同調意思完全唔同（例如「詩／史／試」）。練習時大聲讀出聲調，家長可以一齊對照。"
    },
    {
      title: "注意 ng- 同入聲",
      body: "普通話冇「ng-」開頭（如「我 ngo5」「五 ng5」），亦冇 -p/-t/-k 入聲結尾。多練呢啲，口音會自然好多。"
    },
    {
      title: "n- 同 l- 分清楚",
      body: "「你 nei5」同「李 lei5」唔同。可以對住鏡子睇舌頭位置：n- 舌尖抵上齒齦，l- 舌尖輕觸再放下。"
    },
    {
      title: "課堂實用句優先",
      body: "先學學校常用語：「老師好」「唔該」「洗手間喺邊度」。用得着先記得牢。"
    },
    {
      title: "家長同老師可以點幫",
      body: "唔好只係糾正錯音——先讚努力，再示範正確讀法，請小朋友跟讀兩次。用本 App 嘅「聽」掣作示範亦得。"
    }
  ],

  categories: [
    {
      id: "tones",
      icon: "🎵",
      title: "六聲調",
      subtitle: "掌握粵語聲調基礎",
      color: "#4A90D9",
      words: [
        { char: "詩", jyutping: "si1", tone: 1, meaning: "詩歌（陰平）", tip: "第1聲：高平調，聲線穩高" },
        { char: "史", jyutping: "si2", tone: 2, meaning: "歷史（陰上）", tip: "第2聲：高升調，由中升到高" },
        { char: "試", jyutping: "si3", tone: 3, meaning: "考試（陰去）", tip: "第3聲：中平調，唔高唔低" },
        { char: "時", jyutping: "si4", tone: 4, meaning: "時間（陽平）", tip: "第4聲：低降調，由低再落" },
        { char: "市", jyutping: "si5", tone: 5, meaning: "街市（陽上）", tip: "第5聲：低升調，由低升到中" },
        { char: "是", jyutping: "si6", tone: 6, meaning: "係／是（陽去）", tip: "第6聲：低平調，維持低音" },
        { char: "分", jyutping: "fan1", tone: 1, meaning: "分數（陰平）", tip: "同調練習：fan1" },
        { char: "粉", jyutping: "fan2", tone: 2, meaning: "米粉（陰上）", tip: "同調練習：fan2" }
      ]
    },
    {
      id: "ng-initial",
      icon: "🗣️",
      title: "聲母 ng-",
      subtitle: "我、五、屋——普通話冇嘅 ng-",
      color: "#5CB85C",
      words: [
        { char: "我", jyutping: "ngo5", tone: 5, meaning: "我（自己）", tip: "舌根抵住軟顎，發出鼻音 ng-" },
        { char: "五", jyutping: "ng5", tone: 5, meaning: "數目五", tip: "純鼻音，唔好讀成「唔」" },
        { char: "屋", jyutping: "uk1", tone: 1, meaning: "房屋", tip: "注意：口語有時省略 ng，但「我／五」要保留" },
        { char: "牛", jyutping: "ngau4", tone: 4, meaning: "牛隻", tip: "ng + au，舌根鼻音開頭" },
        { char: "牙", jyutping: "ngaa4", tone: 4, meaning: "牙齒", tip: "ngaa4，張大口" },
        { char: "眼", jyutping: "ngaan5", tone: 5, meaning: "眼睛", tip: "ngaan5，同「我」一樣要有 ng-" },
        { char: "外", jyutping: "ngoi6", tone: 6, meaning: "外面", tip: "ngoi6，唔好讀成 oi6（雖然有人咁講）" }
      ]
    },
    {
      id: "n-l",
      icon: "👄",
      title: "聲母 n- / l-",
      subtitle: "你同李——分清鼻音同邊音",
      color: "#F0AD4E",
      words: [
        { char: "你", jyutping: "nei5", tone: 5, meaning: "你（第二人稱）", tip: "n-：舌尖抵上齒齦，氣走鼻" },
        { char: "李", jyutping: "lei5", tone: 5, meaning: "姓李／李子", tip: "l-：舌尖輕觸再放下，氣走兩邊" },
        { char: "男", jyutping: "naam4", tone: 4, meaning: "男生", tip: "naam4，鼻音清晰" },
        { char: "藍", jyutping: "laam4", tone: 4, meaning: "藍色", tip: "laam4，同「男」對比練習" },
        { char: "南", jyutping: "naam4", tone: 4, meaning: "南方", tip: "同「男」同音，練習 n-" },
        { char: "來", jyutping: "loi4", tone: 4, meaning: "過來", tip: "loi4，l- 開頭" },
        { char: "奶", jyutping: "naai5", tone: 5, meaning: "牛奶", tip: "naai5，唔好讀成 laai5" }
      ]
    },
    {
      id: "gw-kw",
      icon: "🔤",
      title: "聲母 gw- / kw-",
      subtitle: "廣、國——圓唇軟顎音",
      color: "#9B59B6",
      words: [
        { char: "廣", jyutping: "gwong2", tone: 2, meaning: "廣東／廣泛", tip: "gw-：g + 圓唇 w" },
        { char: "國", jyutping: "gwok3", tone: 3, meaning: "國家", tip: "gwok3，入聲 -k 結尾要短促" },
        { char: "貴", jyutping: "gwai3", tone: 3, meaning: "價錢貴", tip: "gwai3" },
        { char: "葵", jyutping: "kwai4", tone: 4, meaning: "葵涌／向日葵", tip: "kw-：送氣 + 圓唇" },
        { char: "裙", jyutping: "kwan4", tone: 4, meaning: "裙子", tip: "kwan4" },
        { char: "光", jyutping: "gwong1", tone: 1, meaning: "光明", tip: "gwong1，第1聲高平" },
        { char: "骨", jyutping: "gwat1", tone: 1, meaning: "骨頭", tip: "gwat1，入聲 -t" }
      ]
    },
    {
      id: "entering",
      icon: "⚡",
      title: "入聲 -p / -t / -k",
      subtitle: "短促收尾——普通話冇嘅韻尾",
      color: "#E74C3C",
      words: [
        { char: "十", jyutping: "sap6", tone: 6, meaning: "數目十", tip: "-p：雙唇閉合突然停" },
        { char: "一", jyutping: "jat1", tone: 1, meaning: "數目一", tip: "-t：舌尖抵上齒齦停" },
        { char: "六", jyutping: "luk6", tone: 6, meaning: "數目六", tip: "-k：舌根抵軟顎停" },
        { char: "百", jyutping: "baak3", tone: 3, meaning: "一百", tip: "baak3，-k 入聲" },
        { char: "七", jyutping: "cat1", tone: 1, meaning: "數目七", tip: "cat1，-t 入聲" },
        { char: "八", jyutping: "baat3", tone: 3, meaning: "數目八", tip: "baat3" },
        { char: "合", jyutping: "hap6", tone: 6, meaning: "合作／合適", tip: "hap6，-p 入聲" },
        { char: "讀", jyutping: "duk6", tone: 6, meaning: "讀書", tip: "duk6，-k 入聲，短促有力" }
      ]
    },
    {
      id: "school",
      icon: "🏫",
      title: "校園日常用語",
      subtitle: "返學即用到嘅句子",
      color: "#1ABC9C",
      words: [
        { char: "老師好", jyutping: "lou5 si1 hou2", tone: null, meaning: "問候老師", tip: "朝早入課室必用" },
        { char: "唔該", jyutping: "m4 goi1", tone: null, meaning: "謝謝／勞煩", tip: "謝謝同「請讓路」都用唔該" },
        { char: "多謝", jyutping: "do1 ze6", tone: null, meaning: "謝謝（收禮時）", tip: "受人恩惠用多謝，服務用唔該" },
        { char: "對唔住", jyutping: "deoi3 m4 zyu6", tone: null, meaning: "對不起", tip: "道歉用語" },
        { char: "洗手間", jyutping: "sai2 sau2 gaan1", tone: null, meaning: "廁所", tip: "問：「洗手間喺邊度？」" },
        { char: "圖書館", jyutping: "tou4 syu1 gun2", tone: null, meaning: "圖書館", tip: "校園常用地點" },
        { char: "放學", jyutping: "fong3 hok6", tone: null, meaning: "下課回家", tip: "fong3 第3聲；hok6 入聲" },
        { char: "做功課", jyutping: "zou6 gung1 fo3", tone: null, meaning: "做家課", tip: "每日必用短語" }
      ]
    }
  ],

  /** 情景練習：短對話／短語，聽＋跟讀 */
  scenarios: [
    {
      id: "campus",
      icon: "🏫",
      title: "校園",
      subtitle: "返學、問路、同老師傾偈",
      color: "#1ABC9C",
      lines: [
        { speaker: "學生", text: "老師早！", jyutping: "lou5 si1 zou2", meaning: "早上問候老師" },
        { speaker: "老師", text: "早啊，入嚟坐啦。", jyutping: "zou2 aa3, jap6 lai4 co5 laa1", meaning: "請學生入座" },
        { speaker: "學生", text: "唔該，洗手間喺邊度？", jyutping: "m4 goi1, sai2 sau2 gaan1 hai2 bin1 dou6", meaning: "問路" },
        { speaker: "同學", text: "直行再轉左就到。", jyutping: "zik6 haang4 zoi3 zyun3 zo2 zau6 dou3", meaning: "指示方向" },
        { speaker: "學生", text: "今日有冇測驗？", jyutping: "gam1 jat6 jau5 mou5 caak1 jim6", meaning: "問課堂安排" },
        { speaker: "學生", text: "我可唔可以問問題？", jyutping: "ngo5 ho2 m4 ho2 ji5 man6 man6 tai4", meaning: "禮貌發問" }
      ]
    },
    {
      id: "supermarket",
      icon: "🛒",
      title: "超市",
      subtitle: "買餸、問價錢、結帳",
      color: "#F0AD4E",
      lines: [
        { speaker: "店員", text: "歡迎光臨！", jyutping: "fun1 jing4 gwong1 lam4", meaning: "招呼顧客" },
        { speaker: "顧客", text: "唔該，蘋果幾多錢一斤？", jyutping: "m4 goi1, ping4 gwo2 gei2 do1 cin2 jat1 gan1", meaning: "問價錢" },
        { speaker: "店員", text: "十八蚊一斤。", jyutping: "sap6 baat3 man1 jat1 gan1", meaning: "報價" },
        { speaker: "顧客", text: "我要兩斤，唔該。", jyutping: "ngo5 jiu3 loeng5 gan1, m4 goi1", meaning: "落單" },
        { speaker: "顧客", text: "有冇膠袋？", jyutping: "jau5 mou5 gaau1 doi2", meaning: "問膠袋" },
        { speaker: "店員", text: "要唔要八達通？", jyutping: "jiu3 m4 jiu3 baat3 daat6 tung1", meaning: "付款方式" }
      ]
    },
    {
      id: "clinic",
      icon: "🏥",
      title: "診所",
      subtitle: "掛號、講症狀、攞藥",
      color: "#E74C3C",
      lines: [
        { speaker: "職員", text: "請攞籌。", jyutping: "cing2 lo2 cau4", meaning: "排隊掛號" },
        { speaker: "病人", text: "我今日唔舒服。", jyutping: "ngo5 gam1 jat6 m4 syu1 fuk6", meaning: "說明來意" },
        { speaker: "醫生", text: "邊度唔舒服？", jyutping: "bin1 dou6 m4 syu1 fuk6", meaning: "問症狀" },
        { speaker: "病人", text: "我頭疼同有少少發燒。", jyutping: "ngo5 tau4 tung3 tung4 jau5 siu2 siu2 faat3 siu1", meaning: "描述症狀" },
        { speaker: "醫生", text: "記得多飲水，好好休息。", jyutping: "gei3 dak1 do1 jam2 seoi2, hou2 hou2 jau1 sik1", meaning: "醫囑" },
        { speaker: "病人", text: "多謝醫生。", jyutping: "do1 ze6 ji1 sang1", meaning: "道謝" }
      ]
    }
  ],

  /** 睇文字錄音測驗 */
  quizSentences: [
    { id: "q1", text: "我今日返學。", jyutping: "ngo5 gam1 jat6 faan1 hok6", focus: "ng- 聲母、入聲", checklist: ["有清晰 ng-（我）", "「學」入聲短促", "聲調自然"] },
    { id: "q2", text: "老師好，唔該借支筆。", jyutping: "lou5 si1 hou2, m4 goi1 ze3 zi1 bat1", focus: "校園禮貌用語", checklist: ["「老師好」聲調啱", "「唔該」清楚", "整體流暢"] },
    { id: "q3", text: "你同李同學一齊嚟。", jyutping: "nei5 tung4 lei5 tung4 hok6 jat1 cai4 lai4", focus: "n- / l- 對比", checklist: ["「你」用 n-", "「李」用 l-", "唔混淆"] },
    { id: "q4", text: "廣東話愈講愈準。", jyutping: "gwong2 dung1 waa2 jyu6 gong2 jyu6 zeon1", focus: "gw- 同聲調", checklist: ["「廣」有 gw-", "「愈」聲調", "句末「準」清楚"] },
    { id: "q5", text: "十萬零一百七十八。", jyutping: "sap6 maan6 ling4 jat1 baak3 cat1 sap6 baat3", focus: "入聲數字", checklist: ["十／七／八入聲", "節奏唔拖長", "數字讀準"] },
    { id: "q6", text: "洗手間喺左邊。", jyutping: "sai2 sau2 gaan1 hai2 zo2 bin1", focus: "日常問答", checklist: ["咬字清楚", "語速適中", "可聽明意思"] }
  ]
};
