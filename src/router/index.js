import {createRouter,createWebHashHistory} from 'vue-router'
import Home from '../views/Home.vue'
import Store from '../views/Store.vue'
import Inspection from '../views/Inspection.vue'
import Staff from '../views/Staff.vue'
import Weekly from '../views/Weekly.vue'
import Support from '../views/Support.vue'

export default createRouter({
history:createWebHashHistory(),
routes:[
{path:'/',component:Home},
{path:'/store',component:Store},
{path:'/inspection',component:Inspection},
{path:'/staff',component:Staff},
{path:'/weekly',component:Weekly},
{path:'/support',component:Support}
]})