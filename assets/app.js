
const stores=["天伦路店","荆胡店","文兴路店","众城街店","凤台路店","建文店","柳林路店","瀚宇天悦城店","姚桥店","兴华南街店","桑园店","泉舜上城店","布袋李店","郑东商业中心店","锦和苑店","工程学院店","七里河南路店","朝阳街店","马寨店","宝瑞路店","岗杜街店","长柳路店"];

let db=JSON.parse(localStorage.db||'{"inspection":[],"staff":[],"weekly":[]}');

function save(){localStorage.db=JSON.stringify(db)}

const app=document.querySelector("#app");

function home(){
app.innerHTML=`
<div class="app">
<div class="card"><h2>江欢欢巡店管理系统</h2>
<p>${new Date().toLocaleDateString()}</p></div>

<div class="grid">
<div class="item">门店<br>${stores.length}</div>
<div class="item">巡店<br>${db.inspection.length}</div>
<div class="item">厨师缺口<br>统计</div>
<div class="item">服务员缺口<br>统计</div>
</div>

<div class="card">
<button class="btn" onclick="storePage()">门店管理</button>
<button class="btn" onclick="inspectionPage()">巡店记录</button>
<button class="btn" onclick="staffPage()">人员管理</button>
<button class="btn" onclick="supportPage()">新店帮扶</button>
<button class="btn" onclick="weeklyPage()">督导周报</button>
</div>
<div class="nav">首页 门店 巡店 人员 我的</div>
</div>`;
}

function storePage(){
app.innerHTML=`<div class="app"><div class="card"><h2>门店管理</h2>
<input placeholder="搜索门店">
${stores.map(x=>`<p>${x}</p>`).join("")}
</div></div>`;
}

function inspectionPage(){
app.innerHTML=`<div class="app"><div class="card"><h2>巡店记录</h2>
<select id="shop">${stores.map(x=>`<option>${x}</option>`).join("")}</select>
<textarea id="problem" placeholder="问题整改"></textarea>
<input type="file" accept="image/*" capture="environment">
<button class="btn" onclick="addInspection()">保存巡店</button>
</div></div>`;
}

function addInspection(){
db.inspection.push({store:shop.value,date:new Date().toLocaleDateString(),problem:problem.value});
save();alert("保存成功");home();
}

function staffPage(){
app.innerHTML=`<div class="app"><div class="card"><h2>人员管理</h2>
<textarea placeholder="姓名"></textarea>
<textarea placeholder="岗位：厨师/服务员"></textarea>
<textarea placeholder="分配门店"></textarea>
<button class="btn">保存人员</button>
</div></div>`;
}

function supportPage(){
app.innerHTML=`<div class="app"><div class="card"><h2>新店帮扶</h2>
<textarea placeholder="帮扶内容"></textarea>
<textarea placeholder="培训情况"></textarea>
<textarea placeholder="后续计划"></textarea>
</div></div>`;
}

function weeklyPage(){
app.innerHTML=`<div class="app"><div class="card"><h2>督导周报</h2>
<textarea placeholder="工作总结"></textarea>
<textarea placeholder="新店进度"></textarea>
<textarea placeholder="开业计划"></textarea>
<textarea placeholder="报货分析"></textarea>
</div></div>`;
}

home();
