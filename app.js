const stores=[
"天伦路店","荆胡店","文兴路店","众城街店","凤台路店",
"建文店","柳林路店","瀚宇天悦城店","姚桥店",
"兴华南街店","桑园店","泉舜上城店","布袋李店",
"郑东商业中心店","锦和苑店","工程学院店",
"七里河南路店","朝阳街店","马寨店",
"宝瑞路店","岗杜街店","长柳路店"
];

let inspections=[];

const app=document.getElementById("app");

function home(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>江欢欢巡店管理系统</h2>
<p>门店：22家</p>
<p>本月巡店：${inspections.length}次</p>
</div>

<div class="card grid">
<button class="btn" onclick="showStores()">门店</button>
<button class="btn" onclick="showInspection()">巡店</button>
<button class="btn" onclick="showStaff()">人员</button>
<button class="btn" onclick="showReport()">督导周报</button>
</div>

<div class="nav">
首页　门店　巡店　人员　我的
</div>
</div>`;
}

window.showStores=function(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>门店管理</h2>
<input placeholder="搜索门店">
${stores.map(s=>`<p>${s}</p>`).join("")}
</div>
</div>`;
}

window.showInspection=function(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>巡店记录</h2>
<select>${stores.map(s=>`<option>${s}</option>`).join("")}</select>
<textarea placeholder="店面情况"></textarea>
<textarea placeholder="卫生情况"></textarea>
<textarea placeholder="后厨情况"></textarea>
<textarea placeholder="问题整改"></textarea>
<input type="file" accept="image/*" capture="environment">
<button class="btn" onclick="saveInspection()">保存巡店</button>
</div>
</div>`;
}

window.saveInspection=function(){
inspections.push(new Date());
alert("巡店保存成功");
home();
}

window.showStaff=function(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>人员管理</h2>
<textarea placeholder="姓名 / 岗位 / 分配门店"></textarea>
<button class="btn">保存人员</button>
</div>
</div>`;
}

window.showReport=function(){
app.innerHTML=`
<div class="app">
<div class="card">
<h2>督导周报</h2>
<textarea placeholder="工作总结"></textarea>
<textarea placeholder="新店进度"></textarea>
<textarea placeholder="开业计划"></textarea>
<textarea placeholder="报货分析"></textarea>
</div>
</div>`;
}

home();
