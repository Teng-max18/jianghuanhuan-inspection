
const stores=["天伦路店", "荆胡店", "文兴路店", "众城街店", "凤台路店", "建文店", "柳林路店", "瀚宇天悦城店", "姚桥店", "兴华南街店", "桑园店", "泉舜上城店", "布袋李店", "郑东商业中心店", "锦和苑店", "工程学院店", "七里河南路店", "朝阳街店", "马寨店", "宝瑞路店", "岗杜街店", "长柳路店"];
document.querySelector('#app').innerHTML=`
<div class="app">
<div class="card"><h2>江欢欢巡店管理系统</h2><p>门店：${stores.length}家</p></div>
<div class="card"><h3>门店管理</h3>${stores.map(x=>'<p>'+x+'</p>').join('')}</div>
<div class="card"><h3>巡店记录</h3><textarea placeholder="问题整改"></textarea><input type="file" accept="image/*" capture="environment"><button>保存巡店</button></div>
<div class="card"><h3>人员管理</h3><p>招聘、分配、缺口统计</p></div>
<div class="card"><h3>新店帮扶</h3><p>独立管理</p></div>
<div class="card"><h3>督导周报</h3><p>工作总结 / 新店进度 / 开业计划 / 报货分析</p></div>
</div>`;
