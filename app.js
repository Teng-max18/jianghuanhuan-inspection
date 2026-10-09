
const stores=["天伦路店","荆胡店","文兴路店","众城街店","凤台路店","建文店","柳林路店","瀚宇天悦城店","姚桥店","兴华南街店","桑园店","泉舜上城店","布袋李店","郑东商业中心店","锦和苑店","工程学院店","七里河南路店","朝阳街店","马寨店","宝瑞路店","岗杜街店","长柳路店"];

let db={
inspection:JSON.parse(localStorage.inspection||"[]"),
staff:JSON.parse(localStorage.staff||"[]"),
weekly:JSON.parse(localStorage.weekly||"[]")
};

const app=document.querySelector("#app");

function save(){
localStorage.inspection=JSON.stringify(db.inspection);
localStorage.staff=JSON.stringify(db.staff);
localStorage.weekly=JSON.stringify(db.weekly);
}

function home(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>江欢欢巡店App</h2>
<p>${new Date().toLocaleDateString()}</p>
</div>

<div class="card grid">
<div class="item">门店<br>${stores.length}</div>
<div class="item">巡店<br>${db.inspection.length}</div>
<div class="item">厨师缺口<br>${db.staff.filter(x=>x.job=="厨师").length}</div>
<div class="item">服务员缺口<br>${db.staff.filter(x=>x.job=="服务员").length}</div>
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

window.storePage=()=>app.innerHTML=`<div class="app"><div class="card"><h2>门店管理</h2><input placeholder="搜索门店">${stores.map(x=>`<div class="store">${x}</div>`).join("")}</div></div>`;

window.inspectionPage=()=>app.innerHTML=`
<div class="app"><div class="card">
<h2>巡店记录</h2>
<select id="shop">${stores.map(x=>`<option>${x}</option>`).join("")}</select>
<textarea id="env" placeholder="店面环境"></textarea>
<textarea id="clean" placeholder="卫生情况"></textarea>
<textarea id="kitchen" placeholder="后厨情况"></textarea>
<textarea id="problem" placeholder="整改问题"></textarea>
<input type="file" accept="image/*" capture="environment">
<button class="btn" onclick="saveInspection()">保存</button>
</div></div>`;

window.saveInspection=()=>{
db.inspection.push({shop:shop.value,date:new Date().toLocaleDateString(),problem:problem.value});
save();alert("巡店保存成功");home();
};

window.staffPage=()=>app.innerHTML=`
<div class="app"><div class="card">
<h2>人员管理</h2>
<input id="name" placeholder="姓名">
<select id="job"><option>厨师</option><option>服务员</option></select>
<input id="store" placeholder="分配门店">
<button class="btn" onclick="saveStaff()">保存</button>
</div></div>`;

window.saveStaff=()=>{
db.staff.push({name:name.value,job:job.value,store:store.value});
save();alert("人员保存成功");home();
};

window.supportPage=()=>app.innerHTML=`
<div class="app"><div class="card">
<h2>新店帮扶</h2>
<textarea placeholder="帮扶内容"></textarea>
<textarea placeholder="培训情况"></textarea>
<textarea placeholder="后续计划"></textarea>
</div></div>`;

window.weeklyPage=()=>app.innerHTML=`
<div class="app"><div class="card">
<h2>督导周报</h2>
<textarea placeholder="工作总结"></textarea>
<textarea placeholder="新店进度"></textarea>
<textarea placeholder="开业计划"></textarea>
<textarea placeholder="报货分析"></textarea>
<button class="btn">保存周报</button>
</div></div>`;

home();
