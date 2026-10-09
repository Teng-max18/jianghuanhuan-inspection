<template>
<div><h2>门店管理</h2><input placeholder='搜索门店'/><p v-for='s in stores'>{{s}}</p></div>
</template>
<script setup>
import stores from '../data/stores'
</script>