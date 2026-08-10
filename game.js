// ========== 游戏全局数据 ==========
const gameData = {
    character: null,
    currentScene: "start",
    inBattle: false,
    enemy: null,
    scenes: {
        start: {
            title: "襄阳城门",
            desc: "你站在襄阳城的城门之下，人来人往，江湖气息扑面而来。城门边上有酒馆、武馆，远处是苍茫古道。你可以四处逛逛，开启你的江湖[...]",
            options: [
                { text: "进入酒馆", next: "tavern" },
                { text: "前往武馆", next: "wuguan" },
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
        { name: "少林长拳", school: "少林", damage: 16 },
        { name: "武当绵掌", school: "武当", damage:15 }
    ],
    items: [
        { name:"金疮药", desc:"恢复40气血", type:"hp", value:40, count:1 },
        { name:"清水", desc:"恢复20内力", type:"mp", value:20, count:1 }
    ],
    enemyList: [
        {name:"山贼",hp:60,maxHp:60,attack:8,defense:2,money:30},
        {name:"盗匪",hp:80,maxHp:80,attack:11,defense:3,money:50}
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

function playSound(filename){
    if(!soundEnabled) return;
    try{
        let audio = new Audio(`./sounds/${filename}.mp3`);
        audio.volume = globalVolume;
        audio.play().catch(e=>{});
    }catch(err){}
}
function toggleSound(){
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('toggle-sound');
    if(btn) btn.innerText = soundEnabled ? '🔊 音效开' : '🔈 音效关';
}
function setVolume(val){
    // val 预计 0-100
    const v = Number(val) / 100;
    if(isNaN(v)) return;
    globalVolume = Math.max(0, Math.min(1, v));
}

// ========== 日志输出 ==========
function addLog(text, type="normal"){
    if(!logBoxEl){
        // 退化到 console，避免报错中断脚本
        console.log(`[log:${type}] ${text}`);
        return;
    }
    const div = document.createElement("div");
    div.innerText = text;
    div.className = "log-item";
    if(type==="system") div.classList.add("system");
    logBoxEl.appendChild(div);
    logBoxEl.scrollTop = logBoxEl.scrollHeight;
}

// ========== 打字机效果 ==========
function typeWrite(el, text, speed=20){
    return new Promise(resolve=>{
        if(!el){
            resolve();
            return;
        }
        el.innerText = "";
        let i=0;
        const timer = setInterval(()=>{
            if(i<text.length){
                el.innerText += text[i];
                i++;
            }else{
                clearInterval(timer);
                resolve();
            }
        },speed);
    })
}

// ========== 渲染主场景【修复重点】 ==========
async function renderScene(){
    if(!optionsListEl) return;
    optionsListEl.innerHTML = "";
    // 已经存在角色，渲染正式游戏场景
    if(gameData.character){
        const scene = gameData.scenes[gameData.currentScene];
        if(!scene) return;
        if(sceneTitleEl) sceneTitleEl.innerText = scene.title;
        if(sceneDescEl) await typeWrite(sceneDescEl, scene.desc,22);

        scene.options.forEach(opt=>{
            const li = document.createElement("li");
            li.innerText = opt.text;
            li.onclick = ()=>{
                playSound("click");
                handleOptionClick(opt);
            }
            optionsListEl.appendChild(li);
        })
    }else{
        // 没有角色：欢迎页 + 创建角色按钮
        if(sceneTitleEl) sceneTitleEl.innerText = "欢迎来到金庸群侠传";
        if(sceneDescEl) sceneDescEl.innerText = "你是一位初入江湖的少侠，怀揣着武侠梦，即将开启一段传奇之旅。请先创建你的角色，开始这段江湖冒险吧！";
        const li = document.createElement("li");
        li.innerText = "创建角色";
        li.onclick = openCreateCharModal;
        optionsListEl.appendChild(li);
    }
    updateStatusBar();
}

// ========== 选项点击处理 ==========
function handleOptionClick(option){
    if(gameData.inBattle) return;
    if(option.next){
        gameData.currentScene = option.next;
        renderScene();
    }else if(option.action){
        runAction(option.action);
    }
}

function runAction(actionName){
    const char = gameData.character;
    switch(actionName){
        case "showBag":
            openBagModal();
            break;
        case "saveGame":
            saveGame();
            addLog("系统：游戏已手动保存！","system");
            break;
        case "drink":
            if(char && char.money >=10){
                char.money -=10;
                char.hp = Math.min(char.maxHp, char.hp+35);
                addLog(`你喝下美酒，气血恢复35点。`);
                playSound("heal");
            }else{
                addLog("银两不足！");
            }
            renderScene();
            break;
        case "hearNews":
            addLog("酒客：听说郊外最近山贼作乱！");
            break;
        case "trainAtk":
            if(char && char.money>=40){
                char.money -=40;
                char.attack +=3;
                addLog("你刻苦练功，攻击力提升3点！");
                playSound("gain");
            }else{
                addLog("银两不够！");
            }
            renderScene();
            break;
        case "meetEnemy":
            startBattle();
            break;
    }
    updateStatusBar();
}

// ========== 角色创建弹窗 ==========
function openCreateCharModal(){
    const modal = document.getElementById("create-char-modal");
    if(modal) modal.style.display = "flex";
}
function closeCreateCharModal(){
    const modal = document.getElementById("create-char-modal");
    if(modal) modal.style.display = "none";
}

function createCharacter(){
    const nameInput = document.getElementById("char-name-input");
    const schoolSel = document.getElementById("char-school");
    const name = nameInput ? nameInput.value.trim() : "";
    const school = schoolSel ? schoolSel.value : "通用";
    if(!name){
        alert("请输入江湖名号！");
        return;
    }
    gameData.character = {
        name: name,
        level:1, exp:0,
        hp:100, maxHp:100,
        mp:50, maxMp:50,
        money:100,
        school: school,
        martialArts:[],
        items:[
            {...gameData.items[0]},
            {...gameData.items[1]}
        ],
        attack:10, defense:5
    };
    // 分配初始武学
    const initWu = gameData.martialArts.find(m=>m.school === school || m.school==="通用");
    if(initWu){
        gameData.character.martialArts.push(initWu.name);
        addLog(`系统：你获得了初始武学【${initWu.name}】！","system");
    }
    // ✅ 创建完成直接切到正式游戏场景
    gameData.currentScene = "start";
    closeCreateCharModal();
    saveGame();
    addLog(`系统：角色【${name}】创建成功！你已拜入${school}门下，开始你的江湖冒险吧！","system");
    playSound("gain");
    renderScene();
}

// ========== 状态栏更新 ==========
function updateStatusBar(){
    const c = gameData.character;
    const nameEl = document.getElementById("char-name");
    const levelEl = document.getElementById("char-level");
    const hpEl = document.getElementById("char-hp");
    const maxHpEl = document.getElementById("char-max-hp");
    const mpEl = document.getElementById("char-mp");
    const maxMpEl = document.getElementById("char-max-mp");
    const moneyEl = document.getElementById("char-money");
    if(!c){
        if(nameEl) nameEl.innerText = "未创建";
        if(levelEl) levelEl.innerText = "1";
        if(hpEl) hpEl.innerText = "0";
        if(maxHpEl) maxHpEl.innerText = "0";
        if(mpEl) mpEl.innerText = "0";
        if(maxMpEl) maxMpEl.innerText = "0";
        if(moneyEl) moneyEl.innerText = "0";
        return;
    }
    if(nameEl) nameEl.innerText = c.name;
    if(levelEl) levelEl.innerText = c.level;
    if(hpEl) hpEl.innerText = c.hp;
    if(maxHpEl) maxHpEl.innerText = c.maxHp;
    if(mpEl) mpEl.innerText = c.mp;
    if(maxMpEl) maxMpEl.innerText = c.maxMp;
    if(moneyEl) moneyEl.innerText = c.money;
}

// ========== 背包（使用 modal 而非 alert）==========
function openBagModal(){
    const c = gameData.character;
    const container = document.getElementById("bag-content");
    if(!container) {
        // fallback to old alert
        showBag();
        return;
    }
    let html = "";
    html += "<h4>物品</h4>";
    if(!c || c.items.length===0) html += "<div>空空如也</div>";
    else{
        c.items.forEach((it,idx)=>{
            html += `<div class="bag-item">${idx+1}. ${it.name} - ${it.desc}（x${it.count??1}）</div>`;
        })
    }
    html += "<h4>武学</h4>";
    if(!c || c.martialArts.length===0) html += "<div>无</div>";
    else c.martialArts.forEach((m,idx)=> html += `<div class="bag-item">${m}</div>`);
    container.innerHTML = html;
    const modal = document.getElementById("bag-modal");
    if(modal) modal.style.display = "flex";
}
function closeBagModal(){
    const modal = document.getElementById("bag-modal");
    if(modal) modal.style.display = "none";
}
function showBag(){
    const c = gameData.character;
    let msg = "【背包】\n";
    if(!c || c.items.length===0) msg += "空空如也";
    else{
        c.items.forEach((it,idx)=>{
            msg += `${idx+1}.${it.name} : ${it.desc}\n`
        })
    }
    alert(msg);
}

// ========== 战斗系统 ==========
function startBattle(){
    gameData.inBattle = true;
    const randIdx = Math.floor(Math.random()*gameData.enemyList.length);
    gameData.enemy = {...gameData.enemyList[randIdx]};
    const e = gameData.enemy;
    addLog(`\n====遭遇战斗！对手：${e.name}====`);
    playSound("fight");
    battleLoop();
}

async function battleLoop(){
    const char = gameData.character;
    const enemy = gameData.enemy;
    while(gameData.inBattle){
        addLog(`【${enemy.name}】HP:${enemy.hp}/${enemy.maxHp}`);
        //玩家行动（目前由自动逻辑处理）
        let wuName = char && char.martialArts.length>0 ? char.martialArts[0] : "普通拳脚";
        let wuObj = gameData.martialArts.find(x=>x.name === wuName);
        let dmg = (wuObj?.damage??8) + (char?.attack??0) - (enemy.defense??0);
        dmg = Math.max(1,dmg);
        enemy.hp -= dmg;
        addLog(`你使出【${wuName}】，造成${dmg}点伤害！`);
        playSound("hurt");
        if(enemy.hp <=0){
            addLog(`✅你击败了${enemy.name}！获得${enemy.money}银两！`);
            if(char) char.money += enemy.money;
            playSound("gain");
            break;
        }
        //敌人反击
        let eDmg = Math.max(1, (enemy.attack??1) - (char?.defense??0));
        if(char){
            char.hp -= eDmg;
            addLog(`${enemy.name}对你发起攻击，造成${eDmg}伤害！`);
            if(char.hp <=0){
                addLog(`💀你被打倒，游戏结束！`);
                gameData.character = null;
                try{ localStorage.removeItem("jinyong-game-data"); }catch(e){}
                break;
            }
        }
        await sleep(600);
    }
    gameData.inBattle = false;
    gameData.enemy = null;
    gameData.currentScene = "wild";
    renderScene();
}

function sleep(ms){
    return new Promise(res=>setTimeout(res,ms));
}

// 占位战斗按钮函数（防止 HTML 中的 onclick 抛错）
function playerAttack(){ addLog("当前为自动战斗回合，暂不支持手动攻击（占位）。"); }
function useSkill(){ alert("使用武学功能尚未实现。"); }
function useItemInFight(){ alert("战斗中使用物品功能尚未实现。"); }
function fleeFight(){ alert("逃跑功能尚未实现。"); }

// ========== 存档本地存储 ==========
function saveGame(){
    try{ localStorage.setItem("jinyong-game-data", JSON.stringify(gameData)); }catch(e){}
}

function loadGame(){
    try{
        const str = localStorage.getItem("jinyong-game-data");
        if(str){
            const saved = JSON.parse(str);
            gameData.character = saved.character;
            gameData.currentScene = saved.currentScene??"start";
            if(gameData.character){
                addLog("系统：已加载存档，欢迎继续你的江湖之旅！","system");
            }
        }
    }catch(e){}
}

// ========== 页面初始化 ==========
window.onload = function(){
    loadGame();
    renderScene();
    // 兼容：index.html 可能没有 confirm-create-btn，先做安全检查再绑定
    const confirmBtn = document.getElementById("confirm-create-btn");
    if(confirmBtn) confirmBtn.onclick = createCharacter;
    // 绑定音量控件（如果存在）
    const vol = document.getElementById("volume");
    if(vol) vol.addEventListener('input', (e)=> setVolume(e.target.value));
    const toggleBtn = document.getElementById("toggle-sound");
    if(toggleBtn) toggleBtn.addEventListener('click', toggleSound);
}
