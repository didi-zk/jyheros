// ========== 游戏版本 ==========
const GAME_VERSION = "v1.0.3";

async function checkForUpdates(manual) {
    try {
        const res = await fetch(`./version.json?t=${Date.now()}`);
        if (!res.ok) { if (manual) addLog("无法检查更新，请检查网络连接。", "system"); return; }
        const data = await res.json();
        if (!data.version) return;
        const known = localStorage.getItem("jyheros_known_version");
        if (data.version !== known) {
            const banner = document.getElementById("update-banner");
            const verEl = document.getElementById("new-version");
            if (banner && verEl) {
                verEl.innerText = data.version;
                banner.style.display = "flex";
            }
            if (manual) addLog(`检测到新版本 ${data.version}，请刷新页面获取更新。`, "system");
        } else if (manual) {
            addLog(`当前已是最新版本 ${GAME_VERSION}`, "system");
        }
    } catch (e) { if (manual) addLog("检查更新失败，请稍后重试。", "system"); }
}

function dismissUpdateBanner() {
    const banner = document.getElementById("update-banner");
    if (banner) banner.style.display = "none";
    fetch(`./version.json?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            if (data.version) localStorage.setItem("jyheros_known_version", data.version);
        })
        .catch(() => {});
}

// ========== 游戏全局数据 ==========
const gameData = {
    character: null,
    currentScene: "start",
    inBattle: false,
    enemy: null,
    _battleStarted: false,
    scenes: {
        start: {
            title: "襄阳城门",
            desc: "你站在襄阳城的城门之下，人来人往，江湖气息扑面而来。城门边上有酒馆、武馆、杂货铺，远处是苍茫古道。你可以四处逛逛，开启你的江湖冒险吧！",
            options: [
                { text: "进入酒馆", next: "tavern", group: "城中活动" },
                { text: "前往武馆", next: "wuguan", group: "城中活动" },
                { text: "杂货铺", next: "shop", group: "城中活动" },
                { text: "出城闯荡", next: "wild", group: "江湖历练" },
                { text: "比武招亲", next: "duel", group: "江湖历练" }
            ]
        },
        tavern: {
            title: "酒馆",
            desc: "酒馆内人声鼎沸，酒客高谈阔论江湖轶事。小二过来招呼你。",
            options: [
                { text: "喝酒恢复气血(10银两)", action: "drink" },
                { text: "静坐调息恢复内力(15银两)", action: "restMp" },
                { text: "打听江湖消息", action: "hearNews" },
                { text: "返回城门", next: "start" }
            ]
        },
        wuguan: {
            title: "江湖武馆",
            desc: "武馆之中不少弟子正在练功，拳风呼啸。馆主看向了你。",
            options: [
                { text: "花钱修炼提升攻击", action: "trainAtk" },
                { text: "返回城门", next: "start" }
            ]
        },
        shop: {
            title: "杂货铺",
            desc: "铺中摆放着各种江湖必备之物，掌柜笑眯眯地看着你。",
            options: [
                { text: "浏览商品", action: "openShop" },
                { text: "返回城门", next: "start" }
            ]
        },
        wild: {
            title: "郊外荒野",
            desc: "城外荒草漫漫，远处树林阴影重重，似乎有危险潜伏。",
            options: [
                { text: "继续深入，寻找敌人", action: "meetEnemy" },
                { text: "探索山洞", next: "cave" },
                { text: "退回襄阳城门", next: "start" }
            ]
        },
        cave: {
            title: "深山洞穴",
            desc: "你发现了一个隐秘的山洞，洞内昏暗潮湿，远处似乎有微光闪烁。",
            options: [
                { text: "进入洞穴探索", action: "exploreCave" },
                { text: "转身离开", next: "wild" }
            ]
        },
        duel: {
            title: "比武招亲",
            desc: "城门口挂着彩带，一位官家小姐正在比武招亲。擂台旁围满了人。",
            options: [
                { text: "上台比试(需等级≥2)", action: "joinDuel" },
                { text: "围观一下", action: "watchDuel" },
                { text: "回到城门", next: "start" }
            ]
        },
        encounter: {
            title: "偶遇陆小凤",
            desc: "一位身穿红衣、留着两撇小胡子的男子向你走来，他似乎遇到了麻烦。",
            options: [
                { text: "拔刀相助", action: "helpLu" },
                { text: "婉言谢绝", action: "refuseLu" }
            ]
        }
    },
    martialArts: [
        { name: "基础拳法", school: "通用", damage: 12 },
        { name: "少林长拳", school: "少林", damage: 18 },
        { name: "武当绵掌", school: "武当", damage: 16 },
        { name: "降龙十八掌", school: "丐帮", damage: 20 },
        { name: "独孤九剑", school: "华山", damage: 22 },
        { name: "天罡北斗阵", school: "全真", damage: 17 },
        { name: "落英神剑掌", school: "桃花岛", damage: 19 }
    ],
    schoolBonuses: {
        "少林": { hpBonus: 30, mpBonus: 0, atkBonus: 0, defBonus: 3 },
        "武当": { hpBonus: 0, mpBonus: 30, atkBonus: 1, defBonus: 2 },
        "丐帮": { hpBonus: 10, mpBonus: 0, atkBonus: 4, defBonus: 0 },
        "华山": { hpBonus: 0, mpBonus: 10, atkBonus: 5, defBonus: 1 },
        "全真": { hpBonus: 10, mpBonus: 20, atkBonus: 2, defBonus: 2 },
        "桃花岛": { hpBonus: 0, mpBonus: 25, atkBonus: 3, defBonus: 1 }
    },
    items: [
        { name: "金疮药", desc: "恢复40气血", type: "hp", value: 40, count: 1 },
        { name: "清水", desc: "恢复20内力", type: "mp", value: 20, count: 1 }
    ],
    shopItems: [
        { name: "金疮药", desc: "恢复40气血", type: "hp", value: 40, price: 20, maxLimit: 0 },
        { name: "清水", desc: "恢复20内力", type: "mp", value: 20, price: 15, maxLimit: 0 },
        { name: "大还丹", desc: "恢复80气血(战斗中使用)", type: "hp", value: 80, price: 60, maxLimit: 0 },
        { name: "内力丹", desc: "恢复50内力(战斗中使用)", type: "mp", value: 50, price: 40, maxLimit: 0 },
        { name: "雪莲", desc: "恢复200气血(战斗中使用)", type: "hp", value: 200, price: 120, maxLimit: 5 },
        { name: "铁布衫", desc: "永久增加3点防御", type: "def", value: 3, price: 60, maxLimit: 1 },
        { name: "攻击秘籍", desc: "永久增加2点攻击", type: "atk", value: 2, price: 180, maxLimit: 3 },
        { name: "内力心法", desc: "永久增加20最大内力", type: "maxmp", value: 20, price: 150, maxLimit: 3 },
        { name: "强身健体", desc: "永久增加30最大气血", type: "maxhp", value: 30, price: 150, maxLimit: 3 }
    ],
    enemyList: [
        { name: "山贼", hp: 60, maxHp: 60, attack: 8, defense: 2, money: 30, exp: 20 },
        { name: "盗匪", hp: 80, maxHp: 80, attack: 11, defense: 3, money: 50, exp: 35 },
        { name: "黑衣人", hp: 110, maxHp: 110, attack: 14, defense: 4, money: 80, exp: 55 },
        { name: "赏金杀手", hp: 140, maxHp: 140, attack: 17, defense: 5, money: 120, exp: 80 },
        { name: "武林盟主", hp: 200, maxHp: 200, attack: 22, defense: 8, money: 200, exp: 150 }
    ],
    quests: {
        currentMain: 0,
        completedMains: [],
        sideFlags: {},
        choices: {}
    },
    questDefs: {
        mainList: [
            { id: 1, name: "神雕侠侣", maxStage: 8 },
            { id: 2, name: "笑傲江湖", maxStage: 0 },
            { id: 3, name: "倚天屠龙记", maxStage: 0 },
            { id: 4, name: "飞狐外传", maxStage: 0 },
            { id: 5, name: "雪山飞狐", maxStage: 0 },
            { id: 6, name: "连城诀", maxStage: 0 },
            { id: 7, name: "天龙八部", maxStage: 0 },
            { id: 8, name: "侠客行", maxStage: 0 },
            { id: 9, name: "笑傲江湖", maxStage: 0 },
            { id: 10, name: "鹿鼎记", maxStage: 0 },
            { id: 11, name: "书剑恩仇录", maxStage: 0 },
            { id: 12, name: "碧血剑", maxStage: 0 },
            { id: 13, name: "鸳鸯刀", maxStage: 0 },
            { id: 14, name: "白马啸西风", maxStage: 0 }
        ],
        sDiao: [
            {
                stage: 1,
                title: "少年杨过",
                desc: "酒馆内的角落里坐着一位忠厚老实的中年人，正是郭靖郭大侠。他告诉你，一位叫杨过的少年流落江湖，需要有人相助。",
                target: "前往酒馆找郭靖",
                trigger: function (gd) { return gd.character && gd.character.level >= 3 && gd.quests.currentMain === 0; },
                isDone: function (gd) { return gd.quests.currentMain >= 1; },
                progress: function (gd) { return { current: 0, total: 1 }; },
                reward: "开启神雕侠侣主线"
            },
            {
                stage: 2,
                title: "终南山",
                desc: "郭靖带你来到终南山下，全真教丘处机道长接见了你。杨过决定拜入全真教门下。",
                target: "正式拜入全真教",
                trigger: function (gd) { return gd.quests.currentMain >= 1 && gd.quests.stage2Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 2; },
                progress: function (gd) { return { current: gd.quests.stage2Done ? 1 : 0, total: 1 }; },
                reward: "获得全真教内功心法（内力上限+10）"
            },
            {
                stage: 3,
                title: "全真教风波",
                desc: "杨过在全真教受赵志敬、甄志丙等人排挤。深夜，杨过来到你面前，眼中满是悲愤。",
                target: "为杨过主持公道",
                trigger: function (gd) { return gd.quests.currentMain >= 2 && gd.quests.stage3Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 3; },
                progress: function (gd) { return { current: gd.quests.stage3Done ? 1 : 0, total: 1 }; },
                reward: "侠义值提升"
            },
            {
                stage: 4,
                title: "入古墓",
                desc: "杨过叛出全真教后，被古墓派小龙女所救。你也随之前往，见识了那神秘的活死人墓。",
                target: "探访古墓派",
                trigger: function (gd) { return gd.quests.currentMain >= 3 && gd.quests.stage4Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 4; },
                progress: function (gd) { return { current: gd.quests.stage4Done ? 1 : 0, total: 1 }; },
                reward: "获得古墓派轻功（闪避提升）"
            },
            {
                stage: 5,
                title: "玉女心经",
                desc: "杨过与小龙女在墓中合练玉女心经，却被甄志丙撞见。甄志丙起了歹心，你必须出手阻止！",
                target: "击败甄志丙",
                trigger: function (gd) { return gd.quests.currentMain >= 4 && gd.quests.stage5Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 5; },
                progress: function (gd) { return { current: gd.quests.stage5Done ? 1 : 0, total: 1 }; },
                reward: "经验×200，银两×300"
            },
            {
                stage: 6,
                title: "绝情谷",
                desc: "小龙女为了救杨过，独自一人进入绝情谷。公孙绿萼告诉你，小龙女可能已中毒。",
                target: "进入绝情谷寻找小龙女",
                trigger: function (gd) { return gd.quests.currentMain >= 5 && gd.quests.stage6Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 6; },
                progress: function (gd) { return { current: gd.quests.stage6Done ? 1 : 0, total: 1 }; },
                reward: "获得寒玉床经验（内力上限+20）"
            },
            {
                stage: 7,
                title: "16年之约",
                desc: "襄阳大战中，杨过为救郭襄中了冰魄银针剧毒。小龙女为了给他续命，跳下绝情谷，留下16年后在此重逢的约定。",
                target: "等待16年之约",
                trigger: function (gd) { return gd.quests.currentMain >= 6 && gd.quests.stage7Done; },
                isDone: function (gd) { return gd.quests.currentMain >= 7; },
                progress: function (gd) { return { current: gd.quests.stage7Done ? 1 : 0, total: 1 }; },
                reward: "杨过传授黯然销魂掌（攻击+3）"
            },
            {
                stage: 8,
                title: "神雕侠侣",
                desc: "16年后，你与杨过、小龙女在绝情谷重逢。此时蒙古大军围攻襄阳，郭靖、黄蓉守城。你随神雕侠侣共赴襄阳，抵御蒙哥大汗！",
                target: "击败蒙哥大汗",
                trigger: function (gd) { return gd.quests.currentMain >= 7 && gd.quests.stage8Ready; },
                isDone: function (gd) { return gd.quests.currentMain >= 8; },
                progress: function (gd) { return { current: gd.quests.currentMain >= 8 ? 1 : 0, total: 1 }; },
                reward: "全属性+5，称号「神雕侠侣之友」，完成神雕侠侣主线！"
            }
        ]
    }
};

// ========== DOM元素 ==========
const sceneTitleEl = document.getElementById("scene-title");
const sceneDescEl = document.getElementById("scene-desc");
const optionsListEl = document.getElementById("options-list");
// 注意：HTML 中日志容器 id 为 log-area，所以在这里使用 log-area（兼容 index.html）
const logBoxEl = document.getElementById("log-area");

// ========== 音效控制 ==========
let soundEnabled = true;   // 游戏音效开关
let globalVolume = 0.7;    // 音量 0.0 - 1.0
let bgmAudio = null;       // 背景音乐Audio对象

function setVolume(val) {
    globalVolume = parseFloat(val) / 100;
    if (bgmAudio) bgmAudio.volume = globalVolume * 0.5;
    const volEl = document.getElementById("volume-val");
    if (volEl) volEl.innerText = val;
}

// 播放游戏音效（click/hurt/gain等）
function playSound(filename) {
    if (!soundEnabled) return;
    try {
        const a = new Audio(`./sounds/${filename}.mp3`);
        a.volume = globalVolume;
        const p = a.play();
        if (p && p.catch) p.catch(function () { });
    } catch (err) { }
}

// 音效开关：控制游戏音效的开/关
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    if (btn) btn.innerText = soundEnabled ? '🔊 开' : '🔈 关';
}

// BGM开关：单按钮控制BGM播放/暂停
function toggleBgm() {
    if (!bgmAudio) {
        addLog('背景音乐未加载，请先选曲。');
        return;
    }
    const btn = document.getElementById('btn-bgm');
    if (bgmAudio.paused) {
        bgmAudio.play().catch(function () { });
        if (btn) btn.innerText = '🎵 开';
    } else {
        bgmAudio.pause();
        if (btn) btn.innerText = '🎵 关';
    }
}

// 选择本地mp3文件作为BGM
function loadBgmFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio = null;
    }
    bgmAudio = new Audio(URL.createObjectURL(file));
    bgmAudio.volume = globalVolume * 0.5;
    bgmAudio.loop = true;
    const nameEl = document.getElementById('bgm-name');
    if (nameEl) nameEl.innerText = file.name;
    // 选曲后自动播放
    bgmAudio.play().catch(function () { });
    const btn = document.getElementById('btn-bgm');
    if (btn) btn.innerText = '🎵 开';
}

// ========== 下拉菜单 ==========
function toggleMenu() {
    const menu = document.getElementById("top-menu");
    if (menu) menu.classList.toggle("open");
}
function closeMenu() {
    const menu = document.getElementById("top-menu");
    if (menu) menu.classList.remove("open");
}
document.addEventListener("click", function (e) {
    const menu = document.getElementById("top-menu");
    const toggle = document.querySelector(".dropdown-toggle");
    if (menu && menu.classList.contains("open")) {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove("open");
        }
    }
});

// ========== 音效弹窗 ==========
function openAudioModal() {
    const modal = document.getElementById("audio-modal");
    if (modal) modal.style.display = "flex";
    const volEl = document.getElementById("volume-val");
    if (volEl) volEl.innerText = document.getElementById("volume").value;
}
function closeAudioModal() {
    const modal = document.getElementById("audio-modal");
    if (modal) modal.style.display = "none";
}

// ========== 分组折叠 ==========
function toggleSceneGroup(titleEl) {
    const group = titleEl.parentElement;
    group.classList.toggle("collapsed");
}

// ========== 日志输出 ==========
function addLog(text, type = "normal") {
    if (!logBoxEl) {
        // 退化到 console，避免报错中断脚本
        console.log(`[log:${type}] ${text}`);
        return;
    }
    const div = document.createElement("div");
    div.innerText = text;
    div.className = "log-item";
    if (type === "system") div.classList.add("system");
    if (type === "event") div.classList.add("event");
    logBoxEl.appendChild(div);
    logBoxEl.scrollTop = logBoxEl.scrollHeight;
}

function addLogSeparator(text = "") {
    if (!logBoxEl) return;
    const div = document.createElement("div");
    div.className = "log-separator";
    div.innerText = text;
    logBoxEl.appendChild(div);
    logBoxEl.scrollTop = logBoxEl.scrollHeight;
}

// ========== 打字机效果 ==========
function typeWrite(el, text, speed = 20) {
    return new Promise(resolve => {
        if (!el) {
            resolve();
            return;
        }
        el.innerText = "";
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                el.innerText += text[i];
                i++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    })
}

// ========== 渲染主场景【修复重点】 ==========
let _rendering = false;
let _renderToken = 0;

async function renderScene() {
    if (!optionsListEl) return;
    if (_rendering) return;
    _rendering = true;
    const myToken = ++_renderToken;
    optionsListEl.innerHTML = "";
    if (gameData.character) {
        const scene = gameData.scenes[gameData.currentScene];
        if (!scene) { _rendering = false; return; }
        if (sceneTitleEl) sceneTitleEl.innerText = scene.title;
        if (sceneDescEl) await typeWrite(sceneDescEl, scene.desc, 22);

        if (myToken !== _renderToken) { _rendering = false; return; }

        // 检测是否有分组
        const hasGroups = scene.options.some(o => o.group);
        if (hasGroups) {
            const groups = {};
            scene.options.forEach(opt => {
                const g = opt.group || "其他";
                if (!groups[g]) groups[g] = [];
                groups[g].push(opt);
            });
            const wrapper = document.createElement("div");
            wrapper.className = "scene-groups-wrapper";
            Object.keys(groups).forEach(gName => {
                const gDiv = document.createElement("div");
                gDiv.className = "scene-group";
                gDiv.innerHTML = `
                    <div class="scene-group-title" onclick="toggleSceneGroup(this)">
                        <span>【${gName}】</span>
                        <span class="arrow">▼</span>
                    </div>
                    <div class="scene-group-body"></div>
                `;
                const body = gDiv.querySelector(".scene-group-body");
                groups[gName].forEach(opt => {
                    const li = document.createElement("li");
                    li.innerText = opt.text;
                    li.onclick = () => {
                        playSound("click");
                        handleOptionClick(opt);
                    };
                    body.appendChild(li);
                });
                wrapper.appendChild(gDiv);
            });
            optionsListEl.appendChild(wrapper);
        } else {
            scene.options.forEach(opt => {
                const li = document.createElement("li");
                li.innerText = opt.text;
                li.onclick = () => {
                    playSound("click");
                    handleOptionClick(opt);
                }
                optionsListEl.appendChild(li);
            });
        }
    } else {
        if (sceneTitleEl) sceneTitleEl.innerText = "欢迎来到金庸群侠传";
        if (sceneDescEl) sceneDescEl.innerText = "你是一位初入江湖的少侠，怀揣着武侠梦，即将开启一段传奇之旅。请先创建你的角色，开始这段江湖冒险吧！";
        const li = document.createElement("li");
        li.innerText = "创建角色";
        li.onclick = openCreateCharModal;
        optionsListEl.appendChild(li);
    }
    updateStatusBar();
    _rendering = false;
}

// ========== 选项点击处理 ==========
let _actionBusy = false;
function handleOptionClick(option) {
    if (gameData.inBattle) return;
    if (_actionBusy) return;
    _actionBusy = true;
    if (option.next) {
        gameData.currentScene = option.next;
        renderScene();
        _actionBusy = false;
    } else if (option.action) {
        runAction(option.action);
    }
}
function _endAction() {
    _actionBusy = false;
}

function runAction(actionName) {
    const char = gameData.character;
    switch (actionName) {
        case "showBag":
            openBagModal();
            break;
        case "saveGame":
            saveGame();
            addLog("系统：游戏已手动保存！", "system");
            break;
        case "drink":
            if (!char) break;
            if (char.hp >= char.maxHp) {
                addLog("你气血充沛，无需喝酒。");
                break;
            }
            if (char.money < 10) {
                addLog("银两不足！需要10银两。");
                break;
            }
            char.money -= 10;
            const hpRestore = Math.min(35, char.maxHp - char.hp);
            char.hp += hpRestore;
            addLog(`你喝下美酒，气血恢复${hpRestore}点。`);
            playSound("heal");
            renderScene();
            break;
        case "restMp":
            if (!char) break;
            if (char.mp >= char.maxMp) {
                addLog("你内力充沛，无需调息。");
                break;
            }
            if (char.money < 15) {
                addLog("银两不足！需要15银两。");
                break;
            }
            char.money -= 15;
            const mpRestore = Math.min(25, char.maxMp - char.mp);
            char.mp += mpRestore;
            addLog(`你静坐调息，内力恢复${mpRestore}点。`);
            playSound("heal");
            renderScene();
            break;
        case "hearNews":
            if (!processQuestThroughAction("hearNews")) {
                addLog("酒客：听说郊外最近山贼作乱！");
            }
            break;
        case "trainAtk":
            if (!char) break;
            if (char.lastTrainMonth === getGameMonthKey()) {
                addLog("这个月你已练过武功，下个月再来吧。");
                break;
            }
            if (char.money < 40) {
                addLog("银两不够！需要40银两。");
                break;
            }
            char.money -= 40;
            char.attack += 3;
            char.lastTrainMonth = getGameMonthKey();
            addLog("你刻苦练功，攻击力提升3点！");
            playSound("gain");
            saveGame();
            renderScene();
            break;
        case "openShop":
            openShopModal();
            break;
        case "meetEnemy":
            triggerRandomEvent();
            break;
        case "exploreCave":
            exploreCave();
            break;
        case "joinDuel":
            joinDuel();
            return;
        case "watchDuel":
            watchDuel();
            break;
        case "helpLu":
            helpLu();
            return;
        case "refuseLu":
            refuseLu();
            break;
    }
    updateStatusBar();
    _endAction();
}
// ========== 剧情事件 ==========
function exploreCave() {
    const char = gameData.character;
    if (!char) return;
    addLogSeparator("探索洞穴");
    const roll = Math.random();
    if (roll < 0.4) {
        const bonus = 20 + Math.floor(Math.random() * 30);
        char.money += bonus;
        addLog(`你在洞穴深处发现了一个古老的宝箱，获得${bonus}银两！`, "event");
        playSound("gain");
    } else if (roll < 0.7) {
        const hpLoss = 10 + Math.floor(Math.random() * 15);
        char.hp = Math.max(1, char.hp - hpLoss);
        addLog(`洞穴中窜出一群蝙蝠，你受到${hpLoss}点伤害！`, "event");
        playSound("hurt");
    } else if (roll < 0.85) {
        const expGain = 25 + Math.floor(Math.random() * 35);
        addLog(`你发现石壁上刻着高深武学心法，领悟了${expGain}点经验！`, "event");
        addExp(expGain);
    } else {
        addLog("洞穴空空如也，你白跑一趟。");
    }
    saveGame();
    updateStatusBar();
    renderScene();
}

function joinDuel() {
    const char = gameData.character;
    if (!char) { _endAction(); return; }
    if (char.level < 2) {
        addLog("你功力尚浅，擂台旁的高手摇了摇头，建议你先升到2级再来。");
        renderScene();
        _endAction();
        return;
    }
    addLogSeparator("比武招亲");
    addLog("你跳上擂台，与小姐的护卫交手！", "event");
    setTimeout(() => {
        const winRate = 0.15 + (char.level - 2) * 0.06 + char.attack * 0.003;
        if (Math.random() < winRate) {
            const reward = 50 + char.level * 20;
            char.money += reward;
            addLog(`🎉 你大胜而归！官家小姐赠予你${reward}银两作为谢礼！`, "event");
            playSound("gain");
            addExp(30);
        } else {
            const dmg = 15 + Math.floor(Math.random() * 20);
            char.hp = Math.max(1, char.hp - dmg);
            addLog(`你被护卫击飞，受了${dmg}点伤害，狼狈下台。`, "event");
            playSound("hurt");
        }
        addLogSeparator("比武结束");
        saveGame();
        updateStatusBar();
        renderScene();
        _endAction();
    }, 1000);
}

function watchDuel() {
    addLog("你围观了一会儿，发现护卫身手不凡，暗自决定以后再来挑战。");
    renderScene();
}

function helpLu() {
    const char = gameData.character;
    if (!char) { _endAction(); return; }
    addLogSeparator("拔刀相助");
    addLog("你挺身而出，与陆小凤一起对抗强敌！", "event");
    setTimeout(() => {
        addLog("一场恶战后，你们击退了敌人。陆小凤感激地递给你一瓶金疮药。", "event");
        const existing = char.items.find(i => i.name === "金疮药");
        if (existing) { existing.count += 2; }
        else { char.items.push({ name: "金疮药", desc: "恢复40气血", type: "hp", value: 40, count: 2 }); }
        addLog("你获得了2瓶金疮药和50点经验！");
        addExp(50);
        gameData.currentScene = "wild";
        saveGame();
        updateStatusBar();
        renderScene();
        _endAction();
    }, 1000);
}

function refuseLu() {
    addLogSeparator("婉言谢绝");
    addLog("你婉言谢绝了陆小凤，他笑笑说后会有期，转身离去。");
    gameData.currentScene = "wild";
    renderScene();
}

// ========== 随机事件系统 ==========
function triggerRandomEvent() {
    const char = gameData.character;
    if (!char) return;
    const roll = Math.random();

    if (roll < 0.50) {
        // 50% 概率：遭遇战斗
        addLogSeparator("遭遇战斗");
        startBattle();

    } else if (roll < 0.65) {
        // 15% 概率：发现宝箱
        addLogSeparator("发现宝箱");
        const reward = 20 + Math.floor(Math.random() * 40);
        char.money += reward;
        addLog(`你在草丛中发现一个宝箱，获得${reward}银两！`, "event");
        playSound("gain");
        saveGame();
        updateStatusBar();

    } else if (roll < 0.75) {
        // 10% 概率：遇到陷阱
        addLogSeparator("遭遇陷阱");
        const dmg = 8 + Math.floor(Math.random() * 12);
        char.hp = Math.max(1, char.hp - dmg);
        addLog(`你踩中了一个陷阱，损失${dmg}点气血！`, "event");
        playSound("hurt");
        updateStatusBar();
        if (char.hp <= 0) {
            addLog("💀你伤重不治，游戏结束！");
            gameData.character = null;
            try { localStorage.removeItem("jinyong-game-data"); } catch (e) { }
        }

    } else if (roll < 0.88) {
        // 13% 概率：遇到江湖高人
        addLogSeparator("江湖奇遇");
        const gain = 15 + Math.floor(Math.random() * 25);
        addLog(`一位隐居高人向你指点，获得${gain}点经验！`, "event");
        addExp(gain);

    } else if (roll < 0.95) {
        // 7% 概率：遇到独行商人
        addLogSeparator("独行商人");
        addLog("你遇到一位独行商人，他以优惠价卖你金疮药(15银两)。", "event");
        addLog("（商人匆匆离去，错过了就没了！）");
        if (char.money >= 15) {
            const existing = char.items.find(i => i.name === "金疮药");
            if (existing) { existing.count++; }
            else { char.items.push({ name: "金疮药", desc: "恢复40气血", type: "hp", value: 40, count: 1 }); }
            char.money -= 15;
            addLog("你买下了一瓶金疮药。");
            playSound("gain");
            saveGame();
            updateStatusBar();
        } else {
            addLog("银两不足，商人摇头离去。");
        }

    } else if (roll < 0.98) {
        // 3% 概率：偶遇陆小凤
        addLogSeparator("偶遇陆小凤");
        gameData.currentScene = "encounter";
        renderScene();
        return;

    } else {
        // 2% 概率：风平浪静
        addLogSeparator("风平浪静");
        addLog("郊外一片寂静，你漫步片刻，什么也没发生。");
    }
    renderScene();
}
// ========== 商店系统 ==========
let _shopQuantities = {};

function openShopModal() {
    const modal = document.getElementById("shop-modal");
    if (modal) modal.style.display = "flex";
    renderShopList();
}

function closeShopModal() {
    const modal = document.getElementById("shop-modal");
    if (modal) modal.style.display = "none";
}

function renderShopList() {
    const char = gameData.character;
    const container = document.getElementById("shop-list");
    if (!container) return;
    if (!char) {
        container.innerHTML = "<p style='text-align:center'>请先创建角色</p>";
        return;
    }
    let html = "";
    gameData.shopItems.forEach((item, idx) => {
        const typeKey = item.type + "_" + item.name;
        if (_shopQuantities[typeKey] === undefined) _shopQuantities[typeKey] = 1;
        const qty = _shopQuantities[typeKey];

        let purchased = 0;
        if (item.maxLimit > 0) {
            if (item.type === "def") purchased = char.boughtIronCloth ? 1 : 0;
            else if (item.type === "atk") purchased = char.boughtAtk || 0;
            else if (item.type === "maxmp") purchased = char.boughtMaxMp || 0;
            else if (item.type === "maxhp") purchased = char.boughtMaxHp || 0;
        }
        const remaining = item.maxLimit > 0 ? item.maxLimit - purchased : -1;
        const soldOut = item.maxLimit > 0 && remaining <= 0;

        const totalPrice = item.price * (soldOut ? 0 : qty);
        const canAfford = char.money >= totalPrice;

        let limitInfo = "";
        if (item.maxLimit > 0) {
            limitInfo = remaining > 0
                ? `<span class="shop-limit">限购 ${item.maxLimit} 次，剩余 ${remaining} 次</span>`
                : `<span class="shop-sold-out">已售罄</span>`;
        }

        html += `
        <div class="shop-item">
            <div class="shop-info">
                <div class="shop-name">${item.name}</div>
                <div class="shop-desc">${item.desc}</div>
                <div class="shop-price">${item.price} 银两 / 件 ${limitInfo}</div>
            </div>
            <div class="shop-qty">
                <button onclick="shopQtyMinus('${typeKey}')" ${soldOut || qty <= 1 ? 'disabled' : ''}>-</button>
                <span>${qty}</span>
                <button onclick="shopQtyPlus('${typeKey}')" ${soldOut ? 'disabled' : ''}>+</button>
            </div>
            <button class="shop-buy-btn"
                onclick="shopBuy('${typeKey}', ${idx})"
                ${soldOut || !canAfford ? 'disabled' : ''}>
                ${soldOut ? '已购完' : '购买'}
            </button>
        </div>`;
    });
    container.innerHTML = html;
}

function shopQtyMinus(key) {
    if (_shopQuantities[key] > 1) {
        _shopQuantities[key]--;
        renderShopList();
    }
}

function shopQtyPlus(key) {
    if (_shopQuantities[key] < 99) {
        _shopQuantities[key]++;
        renderShopList();
    }
}

function shopBuy(key, idx) {
    const char = gameData.character;
    if (!char) return;
    const item = gameData.shopItems[idx];
    if (!item) return;
    const qty = _shopQuantities[key] || 1;

    if (item.maxLimit > 0) {
        let purchased = 0;
        if (item.type === "def") purchased = char.boughtIronCloth ? 1 : 0;
        else if (item.type === "atk") purchased = char.boughtAtk || 0;
        else if (item.type === "maxmp") purchased = char.boughtMaxMp || 0;
        else if (item.type === "maxhp") purchased = char.boughtMaxHp || 0;
        const remaining = item.maxLimit - purchased;
        if (remaining <= 0) {
            addLog(`【${item.name}】已购完！`, "event");
            renderShopList();
            return;
        }
        if (qty > remaining) {
            addLog(`【${item.name}】限购${item.maxLimit}次，剩余${remaining}次，不能购买${qty}件！`, "event");
            return;
        }
    }

    const totalPrice = item.price * qty;
    if (char.money < totalPrice) {
        addLog(`银两不足！【${item.name}】×${qty}需要${totalPrice}银两。`);
        renderShopList();
        return;
    }

    char.money -= totalPrice;

    if (item.type === "def") {
        char.defense += item.value * qty;
        char.boughtIronCloth = true;
        addLog(`你购买了【${item.name}】×${qty}，防御永久+${item.value * qty}！`, "event");
    } else if (item.type === "atk") {
        char.attack += item.value * qty;
        char.boughtAtk = (char.boughtAtk || 0) + qty;
        addLog(`你修炼了【${item.name}】×${qty}，攻击永久+${item.value * qty}！`, "event");
    } else if (item.type === "maxmp") {
        char.maxMp += item.value * qty;
        char.mp += item.value * qty;
        char.boughtMaxMp = (char.boughtMaxMp || 0) + qty;
        addLog(`你修炼了【${item.name}】×${qty}，最大内力永久+${item.value * qty}！`, "event");
    } else if (item.type === "maxhp") {
        char.maxHp += item.value * qty;
        char.hp += item.value * qty;
        char.boughtMaxHp = (char.boughtMaxHp || 0) + qty;
        addLog(`你修炼了【${item.name}】×${qty}，最大气血永久+${item.value * qty}！`, "event");
    } else {
        const existing = char.items.find(i => i.name === item.name);
        if (existing) {
            existing.count += qty;
        } else {
            char.items.push({ name: item.name, desc: item.desc, type: item.type, value: item.value, count: qty });
        }
        addLog(`你购买了【${item.name}】×${qty}！`);
    }

    playSound("gain");
    saveGame();
    updateStatusBar();
    renderShopList();
}
// ========== 角色创建弹窗 ==========
function openCreateCharModal() {
    const modal = document.getElementById("create-char-modal");
    if (modal) modal.style.display = "flex";
}
function closeCreateCharModal() {
    const modal = document.getElementById("create-char-modal");
    if (modal) modal.style.display = "none";
}

function createCharacter() {
    const nameInput = document.getElementById("char-name-input");
    const schoolSel = document.getElementById("char-school-select");
    const name = nameInput ? nameInput.value.trim() : "";
    const school = schoolSel ? schoolSel.value : "通用";
    if (!name) {
        alert("请输入江湖名号！");
        return;
    }
    // 获取门派加成
    const bonus = gameData.schoolBonuses[school] || {};
    const hpBonus = bonus.hpBonus || 0;
    const mpBonus = bonus.mpBonus || 0;
    const atkBonus = bonus.atkBonus || 0;
    const defBonus = bonus.defBonus || 0;

    gameData.character = {
        name: name,
        level: 1, exp: 0, maxExp: 100,
        hp: 100 + hpBonus, maxHp: 100 + hpBonus,
        mp: 50 + mpBonus, maxMp: 50 + mpBonus,
        money: 100,
        school: school,
        martialArts: [],
        items: [
            { ...gameData.items[0] },
            { ...gameData.items[1] }
        ],
        attack: 10 + atkBonus,
        defense: 5 + defBonus,
        realStart: Date.now(),
        gameYear: 1,
        gameMonth: 1 + Math.floor(Math.random() * 12),
        gameDay: 1 + Math.floor(Math.random() * 30),
        avatar: Math.floor(Math.random() * 6)
    };
    // 分配初始武学（门派专属武学优先）
    const initWu = gameData.martialArts.find(m => m.school === school) ||
        gameData.martialArts.find(m => m.school === "通用");
    if (initWu) {
        gameData.character.martialArts.push(initWu.name);
        addLog(`系统：你获得了【${school}】专属武学【${initWu.name}】！`, `system`);
    }
    // 显示门派加成
    const bonusMsg = [];
    if (hpBonus) bonusMsg.push(`气血+${hpBonus}`);
    if (mpBonus) bonusMsg.push(`内力+${mpBonus}`);
    if (atkBonus) bonusMsg.push(`攻击+${atkBonus}`);
    if (defBonus) bonusMsg.push(`防御+${defBonus}`);
    if (bonusMsg.length > 0) {
        addLog(`门派加成：${bonusMsg.join("，")}`, `system`);
    }
    // 创建完成直接切到正式游戏场景
    gameData.currentScene = "start";
    closeCreateCharModal();
    saveGame();
    addLog(`系统：角色【${name}】创建成功！你已拜入${school}门下，开始你的江湖冒险吧！`, `system`);
    playSound("gain");
    renderScene();
}

// ========== 时间系统 ==========
// 现实 10 分钟 = 游戏 1 天
const GAME_DAY_MS = 10 * 60 * 1000;

function getGameDate() {
    const char = gameData.character;
    if (!char) return { year: 1, month: 1, day: 1 };
    const elapsedMs = Date.now() - char.realStart;
    const gameDaysElapsed = Math.floor(elapsedMs / GAME_DAY_MS);
    let totalDays = char.gameDay + gameDaysElapsed - 1;
    let month = char.gameMonth;
    let year = char.gameYear;
    while (totalDays >= 30) {
        totalDays -= 30;
        month++;
        if (month > 12) {
            month -= 12;
            year++;
        }
    }
    return { year, month, day: totalDays + 1 };
}

function formatDate() {
    const d = getGameDate();
    return `金元${d.year}年${d.month}月${d.day}日`;
}

function getGameMonthKey() {
    const d = getGameDate();
    return d.year * 12 + d.month;
}

// ========== 经验升级系统 ==========
function addExp(amount) {
    const char = gameData.character;
    if (!char) return;
    char.exp += amount;
    addLog(`你获得了${amount}点经验值！`);
    checkLevelUp();
}

function checkLevelUp() {
    const char = gameData.character;
    if (!char) return;
    while (char.exp >= char.maxExp) {
        char.exp -= char.maxExp;
        char.level++;
        char.maxExp = Math.floor(char.maxExp * 1.5);
        char.maxHp += 15;
        char.maxMp += 8;
        char.attack += 2;
        char.defense += 1;
        char.hp = char.maxHp;
        char.mp = char.maxMp;
        addLog(`🎉 恭喜！你升到了【${char.level}级】！气血+15，内力+8，攻击+2，防御+1，气血内力全满！`, "system");
        playSound("leavel up");
    }
    updateStatusBar();
    saveGame();
}
// ========== 状态栏更新 ==========
const AVATARS = ["🗡️", "⚔️", "🏹", "🪭", "🧘", "👤"];

function updateStatusBar() {
    const c = gameData.character;
    const nameEl = document.getElementById("char-name");
    const schoolEl = document.getElementById("char-school");
    const avatarEl = document.getElementById("char-avatar");
    const atkEl = document.getElementById("char-atk");
    const defEl = document.getElementById("char-def");
    const dateEl = document.getElementById("char-date");
    const levelEl = document.getElementById("char-level");
    const hpEl = document.getElementById("char-hp");
    const maxHpEl = document.getElementById("char-max-hp");
    const mpEl = document.getElementById("char-mp");
    const maxMpEl = document.getElementById("char-max-mp");
    const moneyEl = document.getElementById("char-money");
    const expEl = document.getElementById("char-exp");
    const maxExpEl = document.getElementById("char-max-exp");
    const hpBar = document.getElementById("char-hp-bar");
    const mpBar = document.getElementById("char-mp-bar");
    if (!c) {
        if (nameEl) nameEl.innerText = "未创建";
        if (schoolEl) schoolEl.innerText = "--";
        if (avatarEl) avatarEl.innerText = "❓";
        if (atkEl) atkEl.innerText = "0";
        if (defEl) defEl.innerText = "0";
        if (levelEl) levelEl.innerText = "1";
        if (hpEl) hpEl.innerText = "0";
        if (maxHpEl) maxHpEl.innerText = "0";
        if (mpEl) mpEl.innerText = "0";
        if (maxMpEl) maxMpEl.innerText = "0";
        if (moneyEl) moneyEl.innerText = "0";
        if (expEl) expEl.innerText = "0";
        if (maxExpEl) maxExpEl.innerText = "100";
        if (hpBar) hpBar.style.width = "0%";
        if (mpBar) mpBar.style.width = "0%";
        return;
    }
    if (nameEl) nameEl.innerText = c.name;
    if (schoolEl) schoolEl.innerText = c.school + "派";
    if (avatarEl) avatarEl.innerText = AVATARS[c.avatar] || "🗡️";
    if (dateEl) dateEl.innerText = formatDate();
    if (levelEl) levelEl.innerText = c.level;
    if (hpEl) hpEl.innerText = c.hp;
    if (maxHpEl) maxHpEl.innerText = c.maxHp;
    if (mpEl) mpEl.innerText = c.mp;
    if (maxMpEl) maxMpEl.innerText = c.maxMp;
    if (moneyEl) moneyEl.innerText = c.money;
    if (expEl) expEl.innerText = c.exp;
    if (maxExpEl) maxExpEl.innerText = c.maxExp;
    if (atkEl) atkEl.innerText = c.attack;
    if (defEl) defEl.innerText = c.defense;
    if (hpBar) hpBar.style.width = (c.maxHp > 0 ? (c.hp / c.maxHp * 100) : 0) + "%";
    if (mpBar) mpBar.style.width = (c.maxMp > 0 ? (c.mp / c.maxMp * 100) : 0) + "%";
}

// ========== 背包（使用 modal 而非 alert）==========
function openBagModal() {
    const c = gameData.character;
    const container = document.getElementById("bag-content");
    if (!container) {
        showBag();
        return;
    }
    let html = "";
    html += "<h4>物品</h4>";
    if (!c || c.items.length === 0) html += "<div>空空如也</div>";
    else {
        c.items.forEach((it, idx) => {
            const max = it.count ?? 1;
            html += `<div class="bag-item" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">`;
            html += `<span>${idx + 1}. ${it.name} - ${it.desc}（x${max}）</span>`;
            if (max > 1) {
                html += `<span style="display:flex;align-items:center;gap:4px;">`;
                html += `<button class="btn-small" onclick="bagUseMinus(${idx})">-</button>`;
                html += `<span id="bag_qty_${idx}" style="min-width:20px;text-align:center;font-weight:bold;">1</span>`;
                html += `<button class="btn-small" onclick="bagUsePlus(${idx},${max})">+</button>`;
                html += `</span>`;
            }
            html += `<button class="btn-small" onclick="useItemByIndex(${idx}, document.getElementById('bag_qty_${idx}') ? parseInt(document.getElementById('bag_qty_${idx}').textContent) : 1);closeBagModal()">使用</button>`;
            html += `</div>`;
        })
    }
    html += "<h4>武学</h4>";
    if (!c || c.martialArts.length === 0) html += "<div>无</div>";
    else c.martialArts.forEach((m, idx) => html += `<div class="bag-item">${m}</div>`);
    container.innerHTML = html;
    const modal = document.getElementById("bag-modal");
    if (modal) modal.style.display = "flex";
}
function closeBagModal() {
    const modal = document.getElementById("bag-modal");
    if (modal) modal.style.display = "none";
}
function bagUseMinus(idx) {
    const el = document.getElementById("bag_qty_" + idx);
    if (el && parseInt(el.textContent) > 1) {
        el.textContent = parseInt(el.textContent) - 1;
    }
}
function bagUsePlus(idx, max) {
    const el = document.getElementById("bag_qty_" + idx);
    if (el && parseInt(el.textContent) < max) {
        el.textContent = parseInt(el.textContent) + 1;
    }
}
function showBag() {
    const c = gameData.character;
    let msg = "【背包】\n";
    if (!c || c.items.length === 0) msg += "空空如也";
    else {
        c.items.forEach((it, idx) => {
            msg += `${idx + 1}.${it.name} : ${it.desc}\n`
        })
    }
    alert(msg);
}

// ========== 战斗系统 ==========
function startBattle() {
    gameData.inBattle = true;
    gameData._battleStarted = true;
    window.addEventListener("beforeunload", preventReload);
    const randIdx = Math.floor(Math.random() * gameData.enemyList.length);
    gameData.enemy = { ...gameData.enemyList[randIdx] };
    const e = gameData.enemy;
    addLog(`遭遇战斗！对手：${e.name}`, "event");
    playSound("fight");
    const modal = document.getElementById("fight-modal");
    if (modal) modal.style.display = "flex";
    updateFightInfo();
    saveGame();
}

function preventReload(e) {
    if (gameData.inBattle) {
        e.preventDefault();
        e.returnValue = "战斗中无法刷新页面！";
    }
}

function updateFightInfo() {
    const char = gameData.character;
    const enemy = gameData.enemy;
    const info = document.getElementById("fight-info");
    const title = document.getElementById("fight-title");
    if (!info) return;
    let html = "";
    if (char) {
        html += `<div>你的气血：${char.hp}/${char.maxHp}</div>`;
        html += `<div>你的内力：${char.mp}/${char.maxMp}</div>`;
    }
    if (enemy) {
        html += `<div>敌人【${enemy.name}】：${enemy.hp}/${enemy.maxHp}</div>`;
    }
    info.innerHTML = html;
    if (title && enemy) title.innerText = `战斗中 - 对阵${enemy.name}`;
}

function endBattle(victory) {
    gameData.inBattle = false;
    gameData.enemy = null;
    gameData._battleStarted = false;
    window.removeEventListener("beforeunload", preventReload);
    const modal = document.getElementById("fight-modal");
    if (modal) modal.style.display = "none";
    if (victory) {
        gameData.currentScene = "wild";
    }
    saveGame();
    renderScene();
}

function enemyTurn() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    const enemy = gameData.enemy;
    if (!char || !enemy) return;
    let eDmg = Math.max(1, enemy.attack - char.defense);
    eDmg = eDmg + Math.floor(Math.random() * 3);
    char.hp -= eDmg;
    addLog(`${enemy.name}对你发起攻击，造成${eDmg}伤害！`);
    playSound("hurt");
    updateFightInfo();
    updateStatusBar();
    if (char.hp <= 0) {
        addLog("💀你被打倒，游戏结束！");
        gameData.character = null;
        try { localStorage.removeItem("jinyong-game-data"); } catch (e) { }
        endBattle(false);
    }
}

// ========== 玩家战斗动作 ==========
function playerAttack() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    const enemy = gameData.enemy;
    if (!char || !enemy) return;
    let dmg = Math.max(1, char.attack - enemy.defense);
    dmg = dmg + Math.floor(Math.random() * 5);
    enemy.hp -= dmg;
    addLog(`你发起普通攻击，对${enemy.name}造成${dmg}点伤害！`);
    playSound("hurt");
    updateFightInfo();
    if (enemy.hp <= 0) {
        addLog(`✅你击败了${enemy.name}！获得${enemy.money}银两！`, "event");
        char.money += enemy.money;
        addExp(enemy.exp || 10);
        playSound("gain");
        updateStatusBar();
        addLogSeparator("战斗胜利");
        endBattle(true);
        return;
    }
    enemyTurn();
}

function useSkill() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    const enemy = gameData.enemy;
    if (!char || !enemy) return;
    if (char.martialArts.length === 0) {
        addLog("你没有可使用的武学！");
        return;
    }
    const wuName = char.martialArts[0];
    const wuObj = gameData.martialArts.find(x => x.name === wuName);
    const mpCost = 10;
    if (char.mp < mpCost) {
        addLog(`内力不足！使用【${wuName}】需要${mpCost}点内力。`);
        return;
    }
    char.mp -= mpCost;
    let dmg = (wuObj?.damage ?? 12) + char.attack - enemy.defense;
    dmg = Math.max(1, dmg);
    enemy.hp -= dmg;
    addLog(`你使出【${wuName}】，造成${dmg}点伤害！`);
    playSound("hurt");
    updateFightInfo();
    updateStatusBar();
    if (enemy.hp <= 0) {
        addLog(`✅你击败了${enemy.name}！获得${enemy.money}银两！`, "event");
        char.money += enemy.money;
        addExp(enemy.exp || 10);
        playSound("gain");
        updateStatusBar();
        addLogSeparator("战斗胜利");
        endBattle(true);
        return;
    }
    enemyTurn();
}

function useItemInFight() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    if (!char || !char.items || char.items.length === 0) {
        addLog("你没有可使用的物品！");
        return;
    }
    const fightOptions = document.querySelector('.fight-options');
    if (!fightOptions) return;
    let html = '<div style="margin-bottom:10px;">选择要使用的物品：</div>';
    char.items.forEach((it, idx) => {
        if (it.count > 0) {
            html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">`;
            html += `<span>${it.name} x${it.count}</span>`;
            html += `<span style="display:flex;align-items:center;gap:4px;">`;
            html += `<button class="btn-small" onclick="fightItemMinus('${idx}')">-</button>`;
            html += `<span id="fight_qty_${idx}" style="min-width:20px;text-align:center;font-weight:bold;">1</span>`;
            html += `<button class="btn-small" onclick="fightItemPlus('${idx}',${it.count})">+</button>`;
            html += `</span>`;
            html += `<button class="btn-small" onclick="useItemByIndex(${idx}, parseInt(document.getElementById('fight_qty_${idx}').textContent))">使用</button>`;
            html += `</div>`;
        }
    });
    html += '<button class="btn btn-cancel" onclick="restoreFightOptions()">取消</button>';
    fightOptions.innerHTML = html;
}

function fightItemMinus(idx) {
    const el = document.getElementById("fight_qty_" + idx);
    if (el && parseInt(el.textContent) > 1) {
        el.textContent = parseInt(el.textContent) - 1;
    }
}
function fightItemPlus(idx, max) {
    const el = document.getElementById("fight_qty_" + idx);
    if (el && parseInt(el.textContent) < max) {
        el.textContent = parseInt(el.textContent) + 1;
    }
}

function restoreFightOptions() {
    const fightOptions = document.querySelector('.fight-options');
    if (!fightOptions) return;
    fightOptions.innerHTML = `
        <button class="btn" onclick="playerAttack()">普通攻击</button>
        <button class="btn" onclick="useSkill()">使用武学</button>
        <button class="btn" onclick="useItemInFight()">使用物品</button>
        <button class="btn btn-cancel" onclick="fleeFight()">逃跑</button>
    `;
}

function useItemByIndex(idx, useCount) {
    const char = gameData.character;
    if (!char || !char.items[idx]) return;
    const it = char.items[idx];
    if (it.count <= 0) return;
    if (!useCount || useCount < 1) useCount = 1;
    if (useCount > it.count) useCount = it.count;

    if (gameData.inBattle) {
        if (it.type === "hp" && char.hp >= char.maxHp) {
            addLog("你气血已满，无需使用此物品。");
            restoreFightOptions();
            return;
        }
        if (it.type === "mp" && char.mp >= char.maxMp) {
            addLog("你内力已满，无需使用此物品。");
            restoreFightOptions();
            return;
        }
        if (it.type === "hp") {
            const missing = char.maxHp - char.hp;
            const actualUsed = Math.min(useCount, Math.ceil(missing / it.value));
            const totalRestore = Math.min(it.value * actualUsed, missing);
            char.hp += totalRestore;
            addLog(`你使用了【${it.name}】×${actualUsed}，恢复${totalRestore}点气血！`);
            it.count -= actualUsed;
        } else if (it.type === "mp") {
            const missing = char.maxMp - char.mp;
            const actualUsed = Math.min(useCount, Math.ceil(missing / it.value));
            const totalRestore = Math.min(it.value * actualUsed, missing);
            char.mp += totalRestore;
            addLog(`你使用了【${it.name}】×${actualUsed}，恢复${totalRestore}点内力！`);
            it.count -= actualUsed;
        }
        char.items = char.items.filter(i => i.count > 0);
        playSound("heal");
        updateFightInfo();
        updateStatusBar();
        enemyTurn();
        restoreFightOptions();
    } else {
        if (it.type === "hp" && char.hp >= char.maxHp) {
            addLog("你气血已满，无需使用此物品。");
            return;
        }
        if (it.type === "mp" && char.mp >= char.maxMp) {
            addLog("你内力已满，无需使用此物品。");
            return;
        }
        if (it.type === "hp") {
            const missing = char.maxHp - char.hp;
            const actualUsed = Math.min(useCount, Math.ceil(missing / it.value));
            const totalRestore = Math.min(it.value * actualUsed, missing);
            char.hp += totalRestore;
            addLog(`你使用了【${it.name}】×${actualUsed}，恢复${totalRestore}点气血！`);
            it.count -= actualUsed;
        } else if (it.type === "mp") {
            const missing = char.maxMp - char.mp;
            const actualUsed = Math.min(useCount, Math.ceil(missing / it.value));
            const totalRestore = Math.min(it.value * actualUsed, missing);
            char.mp += totalRestore;
            addLog(`你使用了【${it.name}】×${actualUsed}，恢复${totalRestore}点内力！`);
            it.count -= actualUsed;
        }
        char.items = char.items.filter(i => i.count > 0);
        playSound("heal");
        updateStatusBar();
        saveGame();
        renderScene();
    }
}

function fleeFight() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    const enemy = gameData.enemy;
    if (!char || !enemy) return;
    const success = Math.random() < 0.5;
    if (success) {
        addLog("你成功逃离了战斗！", "event");
        addLogSeparator("成功逃脱");
        playSound("click");
        endBattle(false);
    } else {
        addLog("逃跑失败！敌人紧追不舍！", "event");
        enemyTurn();
    }
}
// ========== 存档本地存储 ==========
function saveGame() {
    try { localStorage.setItem("jinyong-game-data", JSON.stringify(gameData)); } catch (e) { }
}

function safeReload() {
    if (gameData.inBattle) {
        addLog("战斗中无法刷新，请先结束战斗！", "system");
        return;
    }
    fetch(`./version.json?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            if (data.version) localStorage.setItem("jyheros_known_version", data.version);
        })
        .catch(() => {})
        .finally(() => {
            saveGame();
            const url = new URL(window.location.href);
            url.searchParams.set("_t", Date.now());
            location.replace(url.toString());
        });
}

function newGame() {
    if (!confirm("确定要开启新游戏吗？当前存档将被清除！")) return;
    localStorage.removeItem("jinyong-game-data");
    gameData.character = null;
    gameData.currentScene = "start";
    gameData.inBattle = false;
    gameData.enemy = null;
    gameData._battleStarted = false;
    window.removeEventListener("beforeunload", preventReload);
    gameData.quests = {
        currentMain: 0,
        completedMains: [],
        sideFlags: {},
        choices: {}
    };
    if (logBoxEl) logBoxEl.innerHTML = "";
    document.getElementById("char-name").innerText = "未创建";
    document.getElementById("char-school").innerText = "--";
    document.getElementById("char-date").innerText = "金元--年--月--日";
    document.getElementById("char-level").innerText = "1";
    document.getElementById("char-exp").innerText = "0";
    document.getElementById("char-max-exp").innerText = "100";
    document.getElementById("char-hp").innerText = "100";
    document.getElementById("char-max-hp").innerText = "100";
    document.getElementById("char-mp").innerText = "50";
    document.getElementById("char-max-mp").innerText = "50";
    document.getElementById("char-atk").innerText = "10";
    document.getElementById("char-def").innerText = "5";
    document.getElementById("char-money").innerText = "0";
    document.getElementById("char-avatar").innerText = "🗡️";
    addLog("系统：已开启新游戏，请创建角色。", "system");
    renderScene();
}

function loadGame() {
    try {
        const str = localStorage.getItem("jinyong-game-data");
        if (str) {
            const saved = JSON.parse(str);
            gameData.character = saved.character;
            gameData.currentScene = saved.currentScene ?? "start";
            gameData.quests = saved.quests || gameData.quests;
            gameData.inBattle = false;
            gameData.enemy = null;
            gameData._battleStarted = saved._battleStarted || false;
            if (gameData.character) {
                if (gameData._battleStarted) {
                    const penalty = Math.floor(gameData.character.maxHp * 0.2);
                    gameData.character.hp = Math.max(1, gameData.character.hp - penalty);
                    gameData.character.mp = Math.max(0, gameData.character.mp - Math.floor(gameData.character.maxMp * 0.1));
                    addLog(`战斗中断！你强行逃离战斗，损失了${penalty}点气血和部分内力。`, "event");
                    gameData._battleStarted = false;
                }
                if (!gameData.character.realStart) {
                    gameData.character.realStart = Date.now();
                    gameData.character.gameYear = 1;
                    gameData.character.gameMonth = 1 + Math.floor(Math.random() * 12);
                    gameData.character.gameDay = 1 + Math.floor(Math.random() * 30);
                }
                if (gameData.character.avatar === undefined) {
                    gameData.character.avatar = Math.floor(Math.random() * 6);
                }
                if (gameData.character.school === undefined) {
                    gameData.character.school = "通用";
                }
                if (gameData.character.boughtAtk === undefined) gameData.character.boughtAtk = 0;
                if (gameData.character.boughtMaxMp === undefined) gameData.character.boughtMaxMp = 0;
                if (gameData.character.boughtMaxHp === undefined) gameData.character.boughtMaxHp = 0;
                if (gameData.character.boughtIronCloth === undefined) gameData.character.boughtIronCloth = false;
                if (gameData.quests.currentMain > 0) {
                    const stageKey = "stage" + gameData.quests.currentMain + "Done";
                    if (gameData.quests[stageKey] === undefined) {
                        gameData.quests[stageKey] = true;
                    }
                }
                addLog("系统：已加载存档，欢迎继续你的江湖之旅！", "system");
            }
        }
    } catch (e) { }
}

// ========== 页面初始化 ==========
window.onload = function () {
    loadGame();
    renderScene();
    fetch(`./version.json?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
            const verEl = document.getElementById("menu-version");
            if (verEl && data.version) verEl.innerText = data.version;
        })
        .catch(() => {
            const verEl = document.getElementById("menu-version");
            if (verEl) verEl.innerText = GAME_VERSION;
        });
    checkForUpdates();
    try {
        bgmAudio = new Audio('./sounds/bgm.mp3');
        bgmAudio.volume = globalVolume * 0.5;
        bgmAudio.loop = true;
    } catch (e) { }
    // 每秒更新日期显示
    setInterval(() => {
        const dateEl = document.getElementById("char-date");
        if (dateEl && gameData.character) {
            dateEl.innerText = formatDate();
        }
    }, 1000);
}
// ========== 任务系统 ==========
function openQuestModal() {
    const modal = document.getElementById("quest-modal");
    if (modal) modal.style.display = "flex";
    renderQuestList();
}

function closeQuestModal() {
    const modal = document.getElementById("quest-modal");
    if (modal) modal.style.display = "none";
}

function switchQuestTab(tab) {
    const mainTab = document.getElementById("quest-tab-main");
    const sideTab = document.getElementById("quest-tab-side");
    const mainList = document.getElementById("quest-main-list");
    const sideList = document.getElementById("quest-side-list");
    if (tab === "main") {
        if (mainTab) mainTab.classList.add("active");
        if (sideTab) sideTab.classList.remove("active");
        if (mainList) mainList.style.display = "";
        if (sideList) sideList.style.display = "none";
    } else {
        if (sideTab) sideTab.classList.add("active");
        if (mainTab) mainTab.classList.remove("active");
        if (sideList) sideList.style.display = "";
        if (mainList) mainList.style.display = "none";
    }
    renderQuestList();
}

function renderQuestList() {
    const char = gameData.character;
    const mainList = document.getElementById("quest-main-list");
    const sideList = document.getElementById("quest-side-list");
    if (!mainList) return;

    let html = "";
    const mainListDef = gameData.questDefs.mainList;

    mainListDef.forEach(main => {
        if (main.maxStage === 0) {
            html += `<div class="quest-locked">【${main.name}】尚未开放</div>`;
            return;
        }
        const isCompleted = gameData.quests.completedMains.includes(main.id);
        const sDiao = gameData.questDefs.sDiao;

        if (isCompleted) {
            html += `<div class="quest-completed">✅ 【${main.name}】已完成</div>`;
            return;
        }

        const currentStageIdx = gameData.quests.currentMain;
        const currentStage = sDiao.find(s => s.stage === currentStageIdx + 1);

        if (currentStage && currentStage.stage <= main.maxStage) {
            const isDone = currentStage.isDone(gameData);
            const prog = currentStage.progress(gameData);

            html += `<div class="quest-item">`;
            html += `<div class="quest-title">【${main.name}】第${currentStage.stage}节 · ${currentStage.title}</div>`;
            html += `<div class="quest-desc">${currentStage.desc}</div>`;
            html += `<div class="quest-target">目标：${currentStage.target}</div>`;
            html += `<div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${prog.current / prog.total * 100}%"></div></div>`;
            if (!isDone) {
                html += `<div class="quest-hint">前往【酒馆】打听消息推进剧情</div>`;
            } else {
                html += `<div class="quest-reward">奖励：${currentStage.reward}</div>`;
            }
            html += `</div>`;
        } else {
            html += `<div class="quest-item">`;
            html += `<div class="quest-title">【${main.name}】${main.maxStage}节全完成</div>`;
            html += `</div>`;
        }
    });

    mainList.innerHTML = html;

    if (sideList) {
        sideList.innerHTML = `<div style="color:#888;text-align:center;padding:20px;">暂无支线任务</div>`;
    }
}

function advanceMainStage() {
    const q = gameData.quests;
    const nextStage = q.currentMain + 1;
    const sDiao = gameData.questDefs.sDiao;
    const stage = sDiao.find(s => s.stage === nextStage);

    if (!stage) return;

    const prevStageKey = "stage" + q.currentMain + "Done";
    if (q.currentMain > 0 && !q[prevStageKey]) {
        addLog("上一阶段尚未完成，无法推进主线。", "system");
        return;
    }

    const stageKey = "stage" + nextStage + "Done";
    q[stageKey] = true;

    const stageReadyKey = "stage" + (nextStage + 1) + "Ready";
    q[stageReadyKey] = true;

    q.currentMain = nextStage;

    const char = gameData.character;

    addLogSeparator(`主线推进：${stage.title}`);
    addLog(`📖 ${stage.desc}`, "event");
    addLog(`🎯 目标：${stage.target}`, "event");
    addLog(`🎁 奖励：${stage.reward}`, "event");

    switch (nextStage) {
        case 1:
            addLog("郭靖告诉了你杨过的消息。主线【神雕侠侣】开启！", "system");
            addLog("提示：前往【酒馆】找郭靖对话。");
            break;
        case 2:
            char.maxMp += 10;
            char.mp += 10;
            addLog("你获得了全真教内功心法，最大内力+10！", "system");
            break;
        case 3:
            char.attack += 1;
            addLog("你为杨过主持公道，侠义值提升，攻击+1！", "system");
            break;
        case 4:
            addLog("你获得了古墓派轻功，闪避能力提升！", "system");
            break;
        case 5:
            addLog("你击败了甄志丙！获得经验×200，银两×300！", "system");
            addExp(200);
            char.money += 300;
            break;
        case 6:
            char.maxMp += 20;
            char.mp += 20;
            addLog("你在绝情谷获得寒玉床经验，最大内力+20！", "system");
            break;
        case 7:
            char.attack += 3;
            addLog("杨过传授你黯然销魂掌，攻击+3！", "system");
            break;
        case 8:
            char.attack += 5;
            char.defense += 5;
            char.maxHp += 50;
            char.hp += 50;
            addLog("🎉 恭喜！你完成了【神雕侠侣】主线！全属性+5，气血+50！", "system");
            q.completedMains.push(1);
            break;
    }
    saveGame();
    updateStatusBar();
    renderQuestList();
}

function checkQuestTrigger(sceneName) {
    const q = gameData.quests;
    if (!gameData.character) return;

    if (sceneName === "tavern") {
        if (q.currentMain === 0 && gameData.character.level >= 3) {
            addLog("🔔 你在酒馆中发现了郭靖，他似乎在等你……", "system");
            addLog("（点击【打听江湖消息】推进主线剧情）", "system");
        }

        if (q.currentMain === 1 && !q.stage2Done) {
            addLog("🔔 郭靖带你前往终南山，你看到了丘处机道长……", "system");
            addLog("（点击【打听江湖消息】推进剧情）", "system");
        }
        if (q.currentMain === 2 && !q.stage3Done) {
            addLog("🔔 你在酒馆遇到了满脸悲愤的杨过……", "system");
            addLog("（点击【打听江湖消息】推进剧情）", "system");
        }
        if (q.currentMain === 5 && !q.stage6Done) {
            addLog("🔔 公孙绿萼在酒馆等你，她告诉你小龙女的消息……", "system");
        }
        if (q.currentMain === 6 && !q.stage7Done) {
            addLog("🔔 江湖传言襄阳大战将起，神雕侠侣的故事即将推进……", "system");
        }
        if (q.currentMain === 7 && !q.stage8Ready) {
            addLog("🔔 16年后的重逢时刻已到，蒙哥大汗正率军攻向襄阳……", "system");
        }
    }
}

function processQuestThroughAction(actionName) {
    const q = gameData.quests;
    if (!gameData.character) return false;
    const char = gameData.character;

    if (actionName === "hearNews") {
        const levelReq = [0, 3, 5, 8, 12, 16, 20, 25, 30];
        const nextStage = q.currentMain + 1;
        if (nextStage > 8) return false;

        const reqLevel = levelReq[nextStage] || 99;
        if (char.level < reqLevel) {
            return false;
        }

        const prevStageKey = "stage" + q.currentMain + "Done";
        if (q.currentMain > 0 && !q[prevStageKey]) {
            addLog("上一阶段尚未完成，无法推进主线。", "system");
            return true;
        }

        advanceMainStage();
        return true;
    }

    return false;
}