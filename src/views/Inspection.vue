<template>
<div>
<h2>巡店记录</h2>
<select><option v-for='s in stores'>{{s}}</option></select>
<textarea placeholder='门店情况'/>
<textarea placeholder='卫生情况'/>
<textarea placeholder='后厨情况'/>
<textarea placeholder='整改问题'/>
<input type='file' accept='image/*' capture='environment'/>
<button>保存巡店</button>
</div>
</template>
<script setup>
import stores from '../data/stores'
</script>