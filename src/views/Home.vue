<template>
<div class='page'>
<h1>江欢欢巡店</h1>
<div class='card'>日期：{{date}}</div>
<div class='grid'>
<div class='card'>门店<br>22</div>
<div class='card'>巡店<br>{{records}}</div>
<div class='card'>厨师缺口<br>统计</div>
<div class='card'>服务员缺口<br>统计</div>
</div>
<nav>
<button @click='$router.push("/store")'>门店</button>
<button @click='$router.push("/inspection")'>巡店</button>
<button @click='$router.push("/staff")'>人员</button>
<button @click='$router.push("/weekly")'>周报</button>
</nav>
</div>
</template>
<script setup>
import {getData} from '../database/db'
const date=new Date().toLocaleDateString()
const records=getData('inspection').length
</script>