// 游戏数据
let gameData = {
    character: null,
    currentScene: "start",
    scenes: {
        start: {
            title: "江湖起点",
            desc: "你站在襄阳城门口，人来人往，江湖气息浓厚。前方有客栈、武馆，还有一位看似乞丐的老者在路边坐着。",
            options: [
                { text: "前往客栈休息", nextScene: "inn" },
                { text: "前往武馆学武", nextScene: "martial-hall" },
                { text: "与路边乞丐交谈", nextScene: "beggar-talk" },
                { text: "离开襄阳城，前往野外探索", nextScene: "wilderness" }
            ]
        },
        inn: {
            title: "襄阳客栈",
            desc: "客栈内人声鼎沸，江湖人士三三两两聚在一起，谈论着江湖传闻。店小二热情地迎了上来。",
            options: [
                { text: "点一壶酒，几碟小菜（花费10银两）", nextScene: "inn-eat", cost: { money: 10 } },
                { text: "向店小二打听江湖消息", nextScene: "inn-ask" },
                { text: "在客栈内寻找志同道合的伙伴", nextScene: "inn-friend" },
                { text: "离开客栈，返回城门口", nextScene: "start" }
            ]
        },
        "martial-hall": {
            title: "襄阳武馆",
            desc: "武馆内弟子们正在刻苦练拳，馆主是一位身材魁梧的中年汉子，见你前来，主动上前打招呼。",
            options: [
                { text: "向馆主学习基础拳法（花费20银两，提升攻击力）", nextScene: "martial-learn", cost: { money: 20 } },
                { text: "与武馆弟子切磋武艺", nextScene: "martial-fight" },
                { text: "向馆主请教江湖武学心得", nextScene: "martial-ask" },
                { text: "离开武馆，返回城门口", nextScene: "start" }
            ]
        },
        "beggar-talk": {
            title: "与乞丐交谈",
            desc: "老者见你主动搭话，眼睛一亮，缓缓说道：'少侠初入江湖，可知这江湖险恶？老夫这里有一本粗浅的武学秘籍，可赠予少侠，只需你帮老夫一个小忙。'",
            options: [
                { text: "答应帮忙，接受秘籍", nextScene: "beggar-accept" },
                { text: "询问老者需要帮什么忙", nextScene: "beggar-ask-task" },
                { text: "婉拒老者，离开此处", nextScene: "start" }
            ]
        },
        wilderness: {
            title: "襄阳野外",
            desc: "离开襄阳城，眼前是一片茂密的树林，隐约能听到野兽的叫声，还有一些可疑的人影在树林中晃动。",
            options: [
                { text: "深入树林探索，寻找宝物", nextScene: "wilderness-explore" },
                { text: "小心前行，避开可疑人影", nextScene: "wilderness-careful" },
                { text: "返回襄阳城门口", nextScene: "start" }
            ]
        }
    },
    martialArts: [
        { name: "基础拳法", school: "通用", attack: 5, desc: "江湖基础拳法，简单实用" },
        { name: "太极剑法", school: "武当", attack: 8, mpCost: 3, desc: "武当派绝学，以柔克刚" },
        { name: "降龙十八掌", school: "丐帮", attack: 12, mpCost: 5, desc: "丐帮镇帮之宝，刚猛无俦" },
        { name: "独孤九剑", school: "华山", attack: 10, mpCost: 4, desc: "华山派绝学，剑法灵动，无招胜有招" },
        { name: "少林长拳", school: "少林", attack: 7, desc: "少林基础拳法，扎实稳重" },
        { name: "全真剑法", school: "全真", attack: 9, mpCost: 4, desc: "全真派剑法，道家心法，攻守兼备" },
        { name: "落英神剑掌", school: "桃花岛", attack:11, mpCost:4, desc:"桃花岛独门掌法，缤纷灵动" }
    ],
    items: [
        { name: "疗伤药", type: "consumable", effect: { hp: 50 }, desc: "恢复50点气血" },
        { name: "内力丹", type: "consumable", effect: { mp: 30 }, desc: "恢复30点内力" },
        { name: "武学秘籍（基础）", type: "book", effect: { martial: "基础拳法" }, desc: "学习后掌握基础拳法" },
        { name: "银两袋", type: "money", effect: { money: 50 }, desc: "获得50两银子" }
    ]
};

// -------------------- 新增：打字机效果 --------------------
async function typeWrite(dom, text, speed = 25) {
    dom.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
        dom.innerHTML += text[i];
        await new Promise(res => setTimeout(res, speed));
    }
}

// -------------------- 弹窗控制 --------------------
function openCreateCharModal() { document.getElementById("create-char-modal").style.display = "flex"; }
function closeCreateCharModal() { document.getElementById("create-char-modal").style.display = "none"; }
function openBagModal() {
    const modal = document.getElementById("bag-modal");
    renderBag();
    modal.style.display = "flex";
}
function closeBagModal() { document.getElementById("bag-modal").style.display = "none"; }

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
        if(item.effect.hp) c.hp = Math.min(c.maxHp, c.hp + item.effect.hp);
        if(item.effect.mp) c.mp = Math.min(c.maxMp, c.mp + item.effect.mp);
        addLog(`【${item.name}】使用成功`,"gain");
        c.items.splice(index,1);
    }else if(item.type === "book"){
        if(!c.martialArts.includes(item.effect.martial)){
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

// -------------------- 存档加载 --------------------
function initGame() {
    const savedData = localStorage.getItem("jinyong-game-data");
    if (savedData) {
        gameData = JSON.parse(savedData);
        updateStatusBar();
        renderScene();
        addLog("系统：已加载存档，欢迎继续你的江湖之旅！", "system");
    } else {
        addLog("系统：欢迎来到金庸群侠传文字版，请创建你的角色开始游戏！", "system");
    }
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
        level: 1,
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50,
        money: 50,
        school: school,
        martialArts: [],
        items: [],
        attack: 10, defense: 5
    };

    const initialMartial = gameData.martialArts.find(m => m.school === school || m.school === "通用");
    if (initialMartial) {
        gameData.character.martialArts.push(initialMartial.name);
        addLog(`系统：你获得了初始武学【${initialMartial.name}】！`, "system");
    }
    gameData.character.items.push({ ...gameData.items[0] });
    gameData.character.items.push({ ...gameData.items[3] });

    updateStatusBar();
    renderScene();
    closeCreateCharModal();
    saveGame();
    addLog(`系统：角色【${name}】创建成功！你已拜入${school}门下，开始你的江湖冒险吧！`, "system");
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

async function renderScene() {
    const scene = gameData.scenes[gameData.currentScene];
    if (!scene) return;
    document.getElementById("scene-title").textContent = scene.title;
    await typeWrite(document.getElementById("scene-desc"), scene.desc,22);

    const optionsList = document.getElementById("options-list");
    optionsList.innerHTML = "";
    scene.options.forEach((option, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx+1}. ${option.text}`;
        li.onclick = () => handleOptionClick(option);
        optionsList.appendChild(li);
    });
}

function handleOptionClick(option) {
    if (option.cost) {
        if (option.cost.money && gameData.character.money < option.cost.money) {
            addLog("系统：你的银两不足，无法执行此操作！", "system");
            return;
        }
        if (option.cost.money) gameData.character.money -= option.cost.money;
    }

    switch (gameData.currentScene) {
        case "inn":
            if (option.nextScene === "inn-eat") {
                gameData.character.hp = Math.min(gameData.character.maxHp, gameData.character.hp + 30);
                gameData.character.mp = Math.min(gameData.character.maxMp, gameData.character.mp + 20);
                addLog("系统：你在客栈休息了一番，恢复了30点气血和20点内力。", "event");
            } else if (option.nextScene === "inn-ask") {
                addLog("店小二：客官，最近江湖上流传着一个消息，说是华山派的独孤九剑秘籍遗失了，各大门派都在寻找呢！", "dialog");
            } else if (option.nextScene === "inn-friend") {
                addLog("系统：你在客栈遇到了一位志同道合的少侠，你们相约一起探索江湖。", "event");
            }
            break;
        case "martial-hall":
            if (option.nextScene === "martial-learn") {
                gameData.character.attack += 3;
                addLog("系统：你向武馆馆主学习了基础拳法，攻击力提升了3点！", "event");
            } else if (option.nextScene === "martial-fight") {
                const win = Math.random() > 0.5;
                if (win) {
                    gameData.character.hp = Math.max(1, gameData.character.hp - 10);
                    addLog("系统：你与武馆弟子切磋，险胜一招，消耗了10点气血。", "event");
                } else {
                    gameData.character.hp = Math.max(1, gameData.character.hp - 20);
                    addLog("系统：你与武馆弟子切磋，不慎落败，消耗了20点气血。", "event");
                }
            } else if (option.nextScene === "martial-ask") {
                addLog("馆主：少侠，江湖武学博大精深，唯有勤加练习，方能有所成就。各大门派的绝学各有千秋，你可根据自身特点选择适合自己的武学。", "dialog");
            }
            break;
        case "beggar-talk":
            if (option.nextScene === "beggar-accept") {
                const martialBook = gameData.items.find(item => item.type === "book");
                gameData.character.items.push(martialBook);
                addLog(`系统：你获得了【${martialBook.name}】，可在物品栏中使用学习。`, "gain");
            } else if (option.nextScene === "beggar-ask-task") {
                addLog("老者：老夫的任务很简单，就是帮老夫找回被野狗叼走的钱袋，钱袋就在城外的树林里。", "dialog");
            }
            break;
        case "wilderness":
            if (option.nextScene === "wilderness-explore") {
                const rand = Math.random();
                if (rand < 0.3) {
                    const item = gameData.items[Math.floor(Math.random() * gameData.items.length)];
                    gameData.character.items.push(item);
                    addLog(`系统：你在树林中发现了【${item.name}】！`, "gain");
                } else if (rand < 0.6) {
                    addLog("系统：你遭遇了一群野狗，经过一番搏斗，成功击退了它们，但消耗了30点气血。", "warn");
                    gameData.character.hp = Math.max(1, gameData.character.hp - 30);
                } else {
                    addLog("系统：你在树林中探索了一番，没有发现什么特别的东西。", "event");
                }
            } else if (option.nextScene === "wilderness-careful") {
                addLog("系统：你小心翼翼地前行，避开了可疑的人影，安全返回了城门口。", "event");
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

// 键盘快捷键
document.addEventListener("keydown", function(e){
    if(e.key.toLowerCase() === "s") saveGame();
    if(e.key.toLowerCase() === "b") openBagModal();
});

window.onload = initGame;
