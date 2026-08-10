// -------------------- 全局音效系统 --------------------
let soundEnabled = true;
let bgm;
const sounds = {};

// 预加载音效
function initSounds() {
    const soundList = [
        { name: "bgm", src: "./sounds/bgm.mp3", loop: true },
        { name: "click", src: "./sounds/click.mp3" },
        { name: "fight", src: "./sounds/fight.mp3" },
        { name: "gain", src: "./sounds/gain.mp3" },
        { name: "levelup", src: "./sounds/levelup.mp3" },
        { name: "hurt", src: "./sounds/hurt.mp3" },
        { name: "heal", src: "./sounds/heal.mp3" }
    ];
    soundList.forEach(s => {
        const audio = new Audio(s.src);
        audio.loop = s.loop || false;
        sounds[s.name] = audio;
    });
    bgm = sounds.bgm;
    setVolume(70);
}

function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play().catch(e => console.log("音效播放失败:", e));
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById("toggle-sound").textContent = soundEnabled ? "🔊 音效开" : "🔇 音效关";
    if (soundEnabled) bgm.play();
    else bgm.pause();
}

function setVolume(val) {
    const vol = val / 100;
    Object.values(sounds).forEach(a => a.volume = vol);
}

// -------------------- 游戏数据（剧情大幅扩充） --------------------
let gameData = {
    character: null,
    currentScene: "start",
    currentFight: null,
    scenes: {
        // 初始场景
        start: {
            title: "江湖起点·襄阳城",
            desc: "你站在襄阳城门口，人来人往，江湖气息浓厚。前方有客栈、武馆，还有一位乞丐老者。远处可见郭靖黄蓉镇守的襄阳城大旗。",
            options: [
                { text: "前往客栈休息", nextScene: "inn" },
                { text: "前往武馆学武", nextScene: "martial-hall" },
                { text: "与路边乞丐交谈", nextScene: "beggar-talk" },
                { text: "出城前往桃花岛", nextScene: "taohua-island" },
                { text: "前往光明顶", nextScene: "mingding-top" },
                { text: "前往侠客岛", nextScene: "xiake-island" }
            ]
        },
        // 客栈
        inn: {
            title: "襄阳客栈",
            desc: "客栈内人声鼎沸，江湖人士谈论着武林秘闻。店小二：客官，里面请！最近江湖不太平，听说光明顶明教与六大派要开战了。",
            options: [
                { text: "点酒菜恢复气血（10两）", nextScene: "inn-eat", cost: { money: 10 } },
                { text: "打听江湖消息", nextScene: "inn-ask" },
                { text: "寻找伙伴", nextScene: "inn-friend" },
                { text: "返回城门", nextScene: "start" }
            ]
        },
        // 武馆
        "martial-hall": {
            title: "襄阳武馆",
            desc: "武馆内弟子练拳，馆主：少侠，想学武吗？基础拳法20两，包教包会！",
            options: [
                { text: "学基础拳法（20两）", nextScene: "martial-learn", cost: { money: 20 } },
                { text: "与弟子切磋", nextScene: "martial-fight" },
                { text: "请教武学", nextScene: "martial-ask" },
                { text: "返回城门", nextScene: "start" }
            ]
        },
        // 乞丐剧情（洪七公）
        "beggar-talk": {
            title: "偶遇洪七公",
            desc: "老者笑道：少年人，不错！老夫乃丐帮帮主洪七公。见你根骨不错，传你一招【降龙十八掌·亢龙有悔】，但需帮我找回被抢的绿玉杖。",
            options: [
                { text: "答应帮忙，学降龙掌", nextScene: "beggar-accept" },
                { text: "询问详情", nextScene: "beggar-ask-task" },
                { text: "婉拒离开", nextScene: "start" }
            ]
        },
        // 野外
        wilderness: {
            title: "襄阳野外",
            desc: "城外树林，隐约有野兽与劫匪。",
            options: [
                { text: "深入探索", nextScene: "wilderness-explore" },
                { text: "小心前行", nextScene: "wilderness-careful" },
                { text: "返回城门", nextScene: "start" }
            ]
        },
        // 新增：桃花岛
        "taohua-island": {
            title: "桃花岛·黄药师",
            desc: "你乘船来到桃花岛，岛上桃花盛开，琴声悠扬。黄药师：何方小子，敢闯我桃花岛？报上名来！",
            options: [
                { text: "自报家门，求见黄岛主", nextScene: "taohua-meet" },
                { text: "挑战黄药师", nextScene: "taohua-fight" },
                { text: "寻找九阴真经", nextScene: "taohua-search" },
                { text: "返回襄阳", nextScene: "start" }
            ]
        },
        // 新增：光明顶
        "mingding-top": {
            title: "光明顶·大战",
            desc: "光明顶上，明教张无忌正与六大派高手对峙。你可选择助明教或助六大派。",
            options: [
                { text: "助明教张无忌", nextScene: "mingding-help-mingjiao" },
                { text: "助六大派", nextScene: "mingding-help-liuda" },
                { text: "旁观", nextScene: "mingding-watch" },
                { text: "返回襄阳", nextScene: "start" }
            ]
        },
        // 新增：侠客岛
        "xiake-island": {
            title: "侠客岛·太玄经",
            desc: "你来到侠客岛，岛上刻满武学秘籍。龙木二岛主：少年人，可愿参悟太玄经？",
            options: [
                { text: "参悟太玄经", nextScene: "xiake-study" },
                { text: "挑战岛主", nextScene: "xiake-fight" },
                { text: "返回襄阳", nextScene: "start" }
            ]
        }
    },
    // 武学扩充
    martialArts: [
        { name: "基础拳法", school: "通用", attack: 5, mpCost: 0, desc: "江湖基础拳法" },
        { name: "太极剑法", school: "武当", attack: 8, mpCost: 3, desc: "武当绝学，以柔克刚" },
        { name: "降龙十八掌", school: "丐帮", attack: 15, mpCost: 6, desc: "丐帮镇帮之宝" },
        { name: "独孤九剑", school: "华山", attack: 12, mpCost: 5, desc: "无招胜有招" },
        { name: "少林长拳", school: "少林", attack: 7, mpCost: 0, desc: "少林基础" },
        { name: "落英神剑掌", school: "桃花岛", attack: 11, mpCost: 4, desc: "桃花岛独门" },
        { name: "九阳神功", school: "明教", attack: 20, mpCost: 8, desc: "明教至高内功" },
        { name: "太玄经", school: "侠客岛", attack: 25, mpCost: 10, desc: "侠客岛绝学" }
    ],
    // 物品扩充
    items: [
        { name: "疗伤药", type: "consumable", effect: { hp: 50 }, desc: "恢复50气血" },
        { name: "内力丹", type: "consumable", effect: { mp: 30 }, desc: "恢复30内力" },
        { name: "武学秘籍·基础", type: "book", effect: { martial: "基础拳法" }, desc: "学习基础拳法" },
        { name: "银两袋", type: "money", effect: { money: 100 }, desc: "获得100两" },
        { name: "九阴真经", type: "book", effect: { martial: "九阴白骨爪" }, desc: "学会九阴白骨爪" },
        { name: "九阳神功秘籍", type: "book", effect: { martial: "九阳神功" }, desc: "学会九阳神功" }
    ],
    // 敌人数据
    enemies: {
        "bandit": { name: "劫匪", hp: 80, attack: 8, defense: 3, exp: 20, money: 30 },
        "beggar-enemy": { name: "恶丐", hp: 100, attack: 10, defense: 4, exp: 30, money: 50 },
        "huangyaoshi": { name: "黄药师", hp: 300, attack: 25, defense: 15, exp: 200, money: 500 },
        "zhangwuji": { name: "张无忌", hp: 500, attack: 30, defense: 20, exp: 300, money: 800 },
        "xiake-master": { name: "龙木岛主", hp: 800, attack: 40, defense: 25, exp: 500, money: 1000 }
    }
};

// -------------------- 打字机效果 --------------------
async function typeWrite(dom, text, speed = 25) {
    dom.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
        dom.innerHTML += text[i];
        await new Promise(res => setTimeout(res, speed));
    }
}

// -------------------- 弹窗控制 --------------------
function openCreateCharModal() { playSound("click"); document.getElementById("create-char-modal").style.display = "flex"; }
function closeCreateCharModal() { playSound("click"); document.getElementById("create-char-modal").style.display = "none"; }
function openBagModal() { playSound("click"); const modal = document.getElementById("bag-modal"); renderBag(); modal.style.display = "flex"; }
function closeBagModal() { playSound("click"); document.getElementById("bag-modal").style.display = "none"; }
function openFightModal(enemy) {
    playSound("fight");
    gameData.currentFight = { enemy: {...enemy}, playerHp: gameData.character.hp };
    document.getElementById("fight-title").textContent = `战斗：${enemy.name}`;
    renderFightInfo();
    document.getElementById("fight-modal").style.display = "flex";
}
function closeFightModal() { document.getElementById("fight-modal").style.display = "none"; gameData.currentFight = null; }

// 渲染物品栏
function renderBag() {
    const box = document.getElementById("bag-content");
    const char = gameData.character;
    if (!char) { box.innerHTML = "<p>请先创建角色</p>"; return; }
    let html = "<h4>已学武学</h4>";
    if(char.martialArts.length ===0) html += "<p>暂无武学</p>";
    char.martialArts.forEach(m=> html += `<div class="bag-item">${m}</div>`);

    html += "<h4 style='margin-top:12px'>背包物品</h4>";
    if(char.items.length===0) html += "<p>背包空空如也</p>";
    char.items.forEach((it,idx)=>{
        html += `<div class="bag-item">${it.name} — ${it.desc}
        <button onclick="useItem(${idx})">使用</button>
        </div>`;
    });
    box.innerHTML = html;
}

// 使用物品
function useItem(index){
    const item = gameData.character.items[index];
    if(!item) return;
    const c = gameData.character;
    if(item.type === "consumable"){
        playSound("heal");
        if(item.effect.hp) c.hp = Math.min(c.maxHp, c.hp + item.effect.hp);
        if(item.effect.mp) c.mp = Math.min(c.maxMp, c.mp + item.effect.mp);
        addLog(`【${item.name}】使用成功`,"gain");
        c.items.splice(index,1);
    }else if(item.type === "book"){
        if(!c.martialArts.includes(item.effect.martial)){
            playSound("gain");
            c.martialArts.push(item.effect.martial);
            addLog(`学会武学：${item.effect.martial}`,"gain");
            c.items.splice(index,1);
        }else{
            addLog("你已经学会该武学","warn");
        }
    }
    updateStatusBar();
    renderBag();
    saveGame();
}

// -------------------- 战斗系统 --------------------
function renderFightInfo() {
    const f = gameData.currentFight;
    const info = document.getElementById("fight-info");
    info.innerHTML = `
        <p>你：气血 ${gameData.character.hp}/${gameData.character.maxHp}</p>
        <p>${f.enemy.name}：气血 ${f.enemy.hp}</p>
    `;
}

function playerAttack() {
    const f = gameData.currentFight;
    const damage = Math.max(1, gameData.character.attack - f.enemy.defense);
    f.enemy.hp -= damage;
    addLog(`你攻击${f.enemy.name}，造成${damage}点伤害！`,"event");
    playSound("hurt");
    if (f.enemy.hp <= 0) {
        fightWin();
        return;
    }
    enemyAttack();
}

function enemyAttack() {
    const f = gameData.currentFight;
    const damage = Math.max(1, f.enemy.attack - gameData.character.defense);
    gameData.character.hp = Math.max(1, gameData.character.hp - damage);
    addLog(`${f.enemy.name}攻击你，造成${damage}点伤害！`,"warn");
    playSound("hurt");
    updateStatusBar();
    renderFightInfo();
    if (gameData.character.hp <= 1) {
        fightLose();
    }
}

function fightWin() {
    const f = gameData.currentFight;
    addLog(`你战胜了${f.enemy.name}！获得${f.enemy.exp}经验与${f.enemy.money}银两！`,"gain");
    playSound("gain");
    gameData.character.money += f.enemy.money;
    gainExp(f.enemy.exp);
    closeFightModal();
    updateStatusBar();
    saveGame();
}

function fightLose() {
    addLog("你被击败了，逃回襄阳城！气血恢复至1点。","warn");
    playSound("hurt");
    gameData.character.hp = 1;
    closeFightModal();
    gameData.currentScene = "start";
    renderScene();
    updateStatusBar();
    saveGame();
}

function fleeFight() {
    playSound("click");
    addLog("你成功逃跑！","event");
    closeFightModal();
}

function useSkill() {
    // 简化：使用最强武学
    const skills = gameData.character.martialArts;
    if (skills.length === 0) { addLog("你没有武学可使用！","warn"); return; }
    const skill = gameData.martialArts.find(m => m.name === skills[skills.length-1]);
    if (gameData.character.mp < skill.mpCost) { addLog("内力不足！","warn"); return; }
    gameData.character.mp -= skill.mpCost;
    const damage = Math.max(1, skill.attack + gameData.character.attack - gameData.currentFight.enemy.defense);
    gameData.currentFight.enemy.hp -= damage;
    addLog(`你使用【${skill.name}】，造成${damage}点伤害！`,"event");
    playSound("hurt");
    if (gameData.currentFight.enemy.hp <= 0) fightWin();
    else enemyAttack();
    updateStatusBar();
    renderFightInfo();
}

function useItemInFight() {
    openBagModal();
}

// 经验与升级
function gainExp(exp) {
    const c = gameData.character;
    c.exp = (c.exp || 0) + exp;
    const needExp = c.level * 100;
    if (c.exp >= needExp) {
        c.level++;
        c.exp -= needExp;
        c.maxHp += 20; c.hp = c.maxHp;
        c.maxMp += 10; c.mp = c.maxMp;
        c.attack += 2; c.defense += 1;
        addLog(`恭喜你升级到${c.level}级！属性大幅提升！`,"gain");
        playSound("levelup");
    }
}

// -------------------- 存档加载 --------------------
function initGame() {
    initSounds();
    const savedData = localStorage.getItem("jinyong-game-data");
    if (savedData) {
        gameData = JSON.parse(savedData);
        updateStatusBar();
        renderScene();
        addLog("系统：已加载存档，欢迎继续你的江湖之旅！", "system");
    } else {
        addLog("系统：欢迎来到金庸群侠传文字版，请创建你的角色开始游戏！", "system");
    }
    bgm.play().catch(e => console.log("BGM自动播放被浏览器阻止，点击音效开关开启"));
}

function saveGame() {
    localStorage.setItem("jinyong-game-data", JSON.stringify(gameData));
    addLog("系统：游戏已保存！", "system");
}

// 创建角色
function createCharacter() {
    const name = document.getElementById("char-name-input").value.trim();
    const school = document.getElementById("char-school").value;
    if (!name) { alert("请输入你的江湖名号！"); return; }

    gameData.character = {
        name: name,
        level: 1, exp: 0,
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50,
        money: 100,
        school: school,
        martialArts: [],
        items: [],
        attack: 10, defense: 5
    };

    // 初始武学
    const initialMartial = gameData.martialArts.find(m => m.school === school || m.school === "通用");
    if (initialMartial) {
        gameData.character.martialArts.push(initialMartial.name);
        addLog(`系统：你获得了初始武学【${initialMartial.name}】！`, "system");
    }
    // 初始物品
    gameData.character.items.push({ ...gameData.items[0] });
    gameData.character.items.push({ ...gameData.items[1] });

    updateStatusBar();
    renderScene();
    closeCreateCharModal();
    saveGame();
    addLog(`系统：角色【${name}】创建成功！你已拜入${school}门下，开始你的江湖冒险吧！`, "system");
    playSound("gain");
}

function updateStatusBar() {
    if (!gameData.character) return;
    const c = gameData.character;
    document.getElementById("char-name").textContent = c.name;
    document.getElementById("char-level").textContent = c.level;
    document.getElementById("char-hp").textContent = c.hp;
    document.getElementById("char-max-hp").textContent = c.maxHp;
    document.getElementById("char-mp").textContent = c.mp;
    document.getElementById("char-max-mp").textContent = c.maxMp;
    document.getElementById("char-money").textContent = c.money;
}

// 场景渲染与交互
async function renderScene() {
    const scene = gameData.scenes[gameData.currentScene];
    if (!scene) return;
    document.getElementById("scene-title").textContent = scene.title;
    await typeWrite(document.getElementById("scene-desc"), scene.desc, 22);

    const optionsList = document.getElementById("options-list");
    optionsList.innerHTML = "";
    scene.options.forEach((option, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx+1}. ${option.text}`;
        li.onclick = () => { playSound("click"); handleOptionClick(option); };
        optionsList.appendChild(li);
    });
}

function handleOptionClick(option) {
    if (option.cost) {
        if (option.cost.money && gameData.character.money < option.cost.money) {
            addLog("系统：银两不足！", "system");
            return;
        }
        gameData.character.money -= option.cost.money;
    }

    // 场景逻辑
    switch (gameData.currentScene) {
        case "inn":
            if (option.nextScene === "inn-eat") {
                gameData.character.hp = Math.min(gameData.character.maxHp, gameData.character.hp + 30);
                gameData.character.mp = Math.min(gameData.character.maxMp, gameData.character.mp + 20);
                addLog("系统：你恢复了30气血、20内力。", "event");
                playSound("heal");
            }
            break;
        case "martial-hall":
            if (option.nextScene === "martial-learn") {
                gameData.character.attack += 3;
                addLog("系统：攻击力+3！", "event");
            } else if (option.nextScene === "martial-fight") {
                openFightModal(gameData.enemies.bandit);
                return;
            }
            break;
        case "beggar-talk":
            if (option.nextScene === "beggar-accept") {
                gameData.character.martialArts.push("降龙十八掌");
                addLog("系统：你学会【降龙十八掌】！", "gain");
                playSound("gain");
            }
            break;
        case "wilderness":
            if (option.nextScene === "wilderness-explore") {
                const rand = Math.random();
                if (rand < 0.3) {
                    const item = gameData.items[Math.floor(Math.random()*gameData.items.length)];
                    gameData.character.items.push(item);
                    addLog(`获得【${item.name}】！`,"gain");
                    playSound("gain");
                } else if (rand < 0.7) {
                    openFightModal(gameData.enemies.bandit);
                    return;
                }
            }
            break;
        case "taohua-island":
            if (option.nextScene === "taohua-fight") {
                openFightModal(gameData.enemies.huangyaoshi);
                return;
            } else if (option.nextScene === "taohua-search") {
                gameData.character.items.push({...gameData.items.find(i=>i.name==="九阴真经")});
                addLog("找到【九阴真经】！","gain");
                playSound("gain");
            }
            break;
        case "mingding-top":
            if (option.nextScene.includes("help")) {
                openFightModal(option.nextScene==="mingding-help-mingjiao"?gameData.enemies.zhangwuji:gameData.enemies.huangyaoshi);
                return;
            }
            break;
        case "xiake-island":
            if (option.nextScene === "xiake-study") {
                gameData.character.martialArts.push("太玄经");
                addLog("参悟【太玄经】成功！","gain");
                playSound("gain");
            } else if (option.nextScene === "xiake-fight") {
                openFightModal(gameData.enemies.xiake-master);
                return;
            }
            break;
    }

    gameData.currentScene = option.nextScene;
    updateStatusBar();
    renderScene();
    saveGame();
}

function addLog(message, type = "system") {
    const logArea = document.getElementById("log-area");
    const logItem = document.createElement("div");
    logItem.className = `log-item ${type}`;
    logItem.textContent = message;
    logArea.appendChild(logItem);
    logArea.scrollTop = logArea.scrollHeight;
}

// 快捷键
document.addEventListener("keydown", function(e){
    if(e.key.toLowerCase() === "s") { playSound("click"); saveGame(); }
    if(e.key.toLowerCase() === "b") { playSound("click"); openBagModal(); }
});

window.onload = initGame;
