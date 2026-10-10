/**
 * 輕鬆學發音 / 愈廣愈準 — 課程內容
 * 粵拼（Jyutping）+ 聲調標註，針對新來港兒童常見難點
 */
window.APP_DATA = {
  appName: "輕鬆學發音",
  appSubtitle: "愈廣愈準",
  school: "QESOSA 湯國華中學",
  version: "1.0.0",

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
  ]
};
