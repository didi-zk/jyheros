// ========== 游戏全局数据 ==========
const gameData = {
    character: null,
    currentScene: "start",
    inBattle: false,
    enemy: null,
    scenes: {
        start: {
            title: "襄阳城门",
            desc: "你站在襄阳城的城门之下，人来人往，江湖气息扑面而来。城门边上有酒馆、武馆、杂货铺，远处是苍茫古道。你可以四处逛逛，开启你的江湖冒险吧！",
            options: [
                { text: "进入酒馆", next: "tavern" },
                { text: "前往武馆", next: "wuguan" },
                { text: "逛逛杂货铺", next: "shop" },
                { text: "出城闯荡", next: "wild" },
                { text: "查看背包", action: "showBag" },
                { text: "保存游戏", action: "saveGame" }
            ]
        },
        tavern: {
            title: "酒馆",
            desc: "酒馆内人声鼎沸，酒客高谈阔论江湖轶事。小二过来招呼你。",
            options: [
                { text: "喝酒恢复气血", action: "drink" },
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
                { text: "购买金疮药(20银两)", action: "buyHp" },
                { text: "购买清水(15银两)", action: "buyMp" },
                { text: "购买铁布衫(50银两,永久+3防御)", action: "buyDef" },
                { text: "返回城门", next: "start" }
            ]
        },
        wild: {
            title: "郊外荒野",
            desc: "城外荒草漫漫，远处树林阴影重重，似乎有危险潜伏。",
            options: [
                { text: "继续深入，寻找敌人", action: "meetEnemy" },
                { text: "退回襄阳城门", next: "start" }
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
        { name: "金疮药", desc: "恢复40气血", type: "hp", value: 40, price: 20 },
        { name: "清水", desc: "恢复20内力", type: "mp", value: 20, price: 15 },
        { name: "铁布衫", desc: "永久增加3点防御", type: "def", value: 3, price: 50 }
    ],
    enemyList: [
        { name: "山贼", hp: 60, maxHp: 60, attack: 8, defense: 2, money: 30, exp: 20 },
        { name: "盗匪", hp: 80, maxHp: 80, attack: 11, defense: 3, money: 50, exp: 35 }
    ]
};

// ========== DOM元素 ==========
const sceneTitleEl = document.getElementById("scene-title");
const sceneDescEl = document.getElementById("scene-desc");
const optionsListEl = document.getElementById("options-list");
// 注意：HTML 中日志容器 id 为 log-area，所以在这里使用 log-area（兼容 index.html）
const logBoxEl = document.getElementById("log-area");

// ========== 音效控制 ==========
let soundEnabled = true;
let globalVolume = 0.7; // 0.0 - 1.0

function playSound(filename) {
    if (!soundEnabled) return;
    try {
        let audio = new Audio(`./sounds/${filename}.mp3`);
        audio.volume = globalVolume;
        audio.play().catch(e => { });
    } catch (err) { }
}
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('toggle-sound');
    if (btn) btn.innerText = soundEnabled ? '🔊 音效开' : '🔈 音效关';
}
function setVolume(val) {
    // val 预计 0-100
    const v = Number(val) / 100;
    if (isNaN(v)) return;
    globalVolume = Math.max(0, Math.min(1, v));
    if (bgmAudio) bgmAudio.volume = globalVolume * 0.5;
}

// ========== 背景音乐系统 ==========
let bgmAudio = null;
let bgmPlaying = false;

function loadBgmFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio = null;
    }
    const url = URL.createObjectURL(file);
    bgmAudio = new Audio(url);
    bgmAudio.volume = globalVolume * 0.5;
    bgmAudio.loop = true;
    const nameEl = document.getElementById('bgm-name');
    if (nameEl) nameEl.innerText = file.name;
    toggleBgm(true);
}

function toggleBgm(forcePlay) {
    if (!bgmAudio) {
        addLog('请先选择一首背景音乐！');
        return;
    }
    const btn = document.getElementById('bgm-play');
    if (forcePlay || !bgmPlaying) {
        bgmAudio.play().catch(e => { });
        bgmPlaying = true;
        if (btn) btn.innerText = '⏸ 暂停';
    } else {
        bgmAudio.pause();
        bgmPlaying = false;
        if (btn) btn.innerText = '▶ 播放';
    }
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
async function renderScene() {
    if (!optionsListEl) return;
    optionsListEl.innerHTML = "";
    // 已经存在角色，渲染正式游戏场景
    if (gameData.character) {
        const scene = gameData.scenes[gameData.currentScene];
        if (!scene) return;
        if (sceneTitleEl) sceneTitleEl.innerText = scene.title;
        if (sceneDescEl) await typeWrite(sceneDescEl, scene.desc, 22);

        scene.options.forEach(opt => {
            const li = document.createElement("li");
            li.innerText = opt.text;
            li.onclick = () => {
                playSound("click");
                handleOptionClick(opt);
            }
            optionsListEl.appendChild(li);
        })
    } else {
        // 没有角色：欢迎页 + 创建角色按钮
        if (sceneTitleEl) sceneTitleEl.innerText = "欢迎来到金庸群侠传";
        if (sceneDescEl) sceneDescEl.innerText = "你是一位初入江湖的少侠，怀揣着武侠梦，即将开启一段传奇之旅。请先创建你的角色，开始这段江湖冒险吧！";
        const li = document.createElement("li");
        li.innerText = "创建角色";
        li.onclick = openCreateCharModal;
        optionsListEl.appendChild(li);
    }
    updateStatusBar();
}

// ========== 选项点击处理 ==========
function handleOptionClick(option) {
    if (gameData.inBattle) return;
    if (option.next) {
        gameData.currentScene = option.next;
        renderScene();
    } else if (option.action) {
        runAction(option.action);
    }
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
            if (char && char.money >= 10) {
                char.money -= 10;
                char.hp = Math.min(char.maxHp, char.hp + 35);
                addLog(`你喝下美酒，气血恢复35点。`);
                playSound("heal");
            } else {
                addLog("银两不足！");
            }
            renderScene();
            break;
        case "hearNews":
            addLog("酒客：听说郊外最近山贼作乱！");
            break;
        case "trainAtk":
            if (char && char.money >= 40) {
                char.money -= 40;
                char.attack += 3;
                addLog("你刻苦练功，攻击力提升3点！");
                playSound("gain");
            } else {
                addLog("银两不够！");
            }
            renderScene();
            break;
        case "buyHp":
            buyShopItem("hp");
            break;
        case "buyMp":
            buyShopItem("mp");
            break;
        case "buyDef":
            buyShopItem("def");
            break;
        case "meetEnemy":
            startBattle();
            break;
    }
    updateStatusBar();
}
// ========== 商店购买 ==========
function buyShopItem(type) {
    const char = gameData.character;
    if (!char) return;
    const item = gameData.shopItems.find(si => si.type === type);
    if (!item) {
        addLog("商店里没有这种东西！");
        return;
    }
    if (char.money < item.price) {
        addLog(`银两不足！【${item.name}】需要${item.price}银两。`);
        return;
    }
    char.money -= item.price;
    if (type === "def") {
        char.defense += item.value;
        addLog(`你购买了【${item.name}】，防御永久+${item.value}！`);
    } else {
        const existing = char.items.find(i => i.name === item.name);
        if (existing) {
            existing.count++;
        } else {
            char.items.push({ name: item.name, desc: item.desc, type: item.type, value: item.value, count: 1 });
        }
        addLog(`你购买了【${item.name}】！`);
    }
    playSound("gain");
    saveGame();
    updateStatusBar();
    renderScene();
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
    const schoolSel = document.getElementById("char-school");
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
        defense: 5 + defBonus
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
function updateStatusBar() {
    const c = gameData.character;
    const nameEl = document.getElementById("char-name");
    const expEl = document.getElementById("char-exp");
    const maxExpEl = document.getElementById("char-max-exp");
    const levelEl = document.getElementById("char-level");
    const hpEl = document.getElementById("char-hp");
    const maxHpEl = document.getElementById("char-max-hp");
    const mpEl = document.getElementById("char-mp");
    const maxMpEl = document.getElementById("char-max-mp");
    const moneyEl = document.getElementById("char-money");
    if (!c) {
        if (nameEl) nameEl.innerText = "未创建";
        if (levelEl) levelEl.innerText = "1";
        if (hpEl) hpEl.innerText = "0";
        if (maxHpEl) maxHpEl.innerText = "0";
        if (mpEl) mpEl.innerText = "0";
        if (maxMpEl) maxMpEl.innerText = "0";
        if (moneyEl) moneyEl.innerText = "0";
        if (expEl) expEl.innerText = "0";
        if (maxExpEl) maxExpEl.innerText = "100";
        return;
    }
    if (nameEl) nameEl.innerText = c.name;
    if (levelEl) levelEl.innerText = c.level;
    if (hpEl) hpEl.innerText = c.hp;
    if (maxHpEl) maxHpEl.innerText = c.maxHp;
    if (mpEl) mpEl.innerText = c.mp;
    if (maxMpEl) maxMpEl.innerText = c.maxMp;
    if (moneyEl) moneyEl.innerText = c.money;
    if (expEl) expEl.innerText = c.exp;
    if (maxExpEl) maxExpEl.innerText = c.maxExp;
}

// ========== 背包（使用 modal 而非 alert）==========
function openBagModal() {
    const c = gameData.character;
    const container = document.getElementById("bag-content");
    if (!container) {
        // fallback to old alert
        showBag();
        return;
    }
    let html = "";
    html += "<h4>物品</h4>";
    if (!c || c.items.length === 0) html += "<div>空空如也</div>";
    else {
        c.items.forEach((it, idx) => {
            html += `<div class="bag-item">${idx + 1}. ${it.name} - ${it.desc}（x${it.count ?? 1}）</div>`;
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
    const randIdx = Math.floor(Math.random() * gameData.enemyList.length);
    gameData.enemy = { ...gameData.enemyList[randIdx] };
    const e = gameData.enemy;
    addLog(`\n====遭遇战斗！对手：${e.name}====`);
    playSound("fight");
    const modal = document.getElementById("fight-modal");
    if (modal) modal.style.display = "flex";
    updateFightInfo();
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
    const modal = document.getElementById("fight-modal");
    if (modal) modal.style.display = "none";
    if (victory) {
        gameData.currentScene = "wild";
    }
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
        addLog(`✅你击败了${enemy.name}！获得${enemy.money}银两！`);
        char.money += enemy.money;
        addExp(enemy.exp || 10);
        playSound("gain");
        updateStatusBar();
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
        addLog(`✅你击败了${enemy.name}！获得${enemy.money}银两！`);
        char.money += enemy.money;
        addExp(enemy.exp || 10);
        playSound("gain");
        updateStatusBar();
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
    let used = false;
    for (let i = 0; i < char.items.length; i++) {
        const it = char.items[i];
        if (it.count > 0) {
            if (it.type === "hp" && char.hp < char.maxHp) {
                char.hp = Math.min(char.maxHp, char.hp + it.value);
                addLog(`你使用了【${it.name}】，恢复${it.value}点气血！`);
                playSound("heal");
                it.count--;
                used = true;
                break;
            } else if (it.type === "mp" && char.mp < char.maxMp) {
                char.mp = Math.min(char.maxMp, char.mp + it.value);
                addLog(`你使用了【${it.name}】，恢复${it.value}点内力！`);
                playSound("heal");
                it.count--;
                used = true;
                break;
            }
        }
    }
    if (!used) {
        addLog("没有合适的物品可以使用！");
        return;
    }
    char.items = char.items.filter(it => it.count > 0);
    updateFightInfo();
    updateStatusBar();
    enemyTurn();
}

function fleeFight() {
    if (!gameData.inBattle) return;
    const char = gameData.character;
    const enemy = gameData.enemy;
    if (!char || !enemy) return;
    const success = Math.random() < 0.5;
    if (success) {
        addLog("你成功逃离了战斗！");
        playSound("click");
        endBattle(false);
    } else {
        addLog("逃跑失败！敌人紧追不舍！");
        enemyTurn();
    }
}
// ========== 存档本地存储 ==========
function saveGame() {
    try { localStorage.setItem("jinyong-game-data", JSON.stringify(gameData)); } catch (e) { }
}

function loadGame() {
    try {
        const str = localStorage.getItem("jinyong-game-data");
        if (str) {
            const saved = JSON.parse(str);
            gameData.character = saved.character;
            gameData.currentScene = saved.currentScene ?? "start";
            if (gameData.character) {
                addLog("系统：已加载存档，欢迎继续你的江湖之旅！", "system");
            }
        }
    } catch (e) { }
}

// ========== 页面初始化 ==========
window.onload = function () {
    loadGame();
    renderScene();
    // 兼容：index.html 可能没有 confirm-create-btn，先做安全检查再绑定
    const confirmBtn = document.getElementById("confirm-create-btn");
    if (confirmBtn) confirmBtn.onclick = createCharacter;
    // 绑定音量控件（如果存在)
    const vol = document.getElementById("volume");
    if (vol) vol.addEventListener('input', (e) => setVolume(e.target.value));
    const toggleBtn = document.getElementById("toggle-sound");
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSound);
}
