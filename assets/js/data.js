(function () {
    'use strict';
    const names = ['天伦路店', '荆胡店', '文兴路店', '众城街店', '凤台路店', '建文店', '柳林路店', '瀚宇天悦城店', '姚桥店', '兴华南街店', '桑园店', '泉舜上城店', '布袋李店', '郑东商业中心店', '锦和苑店', '工程学院店', '七里河南路店', '朝阳街店', '马寨店', '宝瑞路店', '岗杜街店', '长柳路店'];
    window.Inspect = {
        version: '2.0.1',
        pages: {},
        forms: {},
        actions: {},
        data: {
            brands: ['江欢欢江西小炒', '江玖玖江西小炒'],
            roles: ['厨师', '服务员', '店长', '收银员', '后厨辅助'],
            stores: names.map((name, index) => ({
                id: 'store-' + String(index + 1).padStart(2, '0'),
                name, brand: index < 20 ? '江欢欢江西小炒' : '江玖玖江西小炒',
                status: '营业中', address: '', manager: '', phone: '', openingDate: '',
                targets: { '厨师': 0, '服务员': 0, '店长': 0, '收银员': 0, '后厨辅助': 0 }, notes: ''
            })),
            checklist: [
                { id: 'hygiene', group: '环境卫生', label: '前厅、后厨及卫生间清洁' },
                { id: 'storage', group: '食品安全', label: '食材储存、效期与生熟分离' },
                { id: 'equipment', group: '食品安全', label: '冷藏温度与设备运行' },
                { id: 'production', group: '出品标准', label: '菜品口味、份量与出餐速度' },
                { id: 'service', group: '服务规范', label: '接待、仪容与顾客反馈' },
                { id: 'staffing', group: '人员管理', label: '人员到岗与培训情况' },
                { id: 'stock', group: '物料管理', label: '物料库存与报货情况' },
                { id: 'safety', group: '设施安全', label: '消防、电气与通道检查' }
            ],
            stages: ['测量设计', '出图（平面、效果、施工）', '装修施工', '平面设计（定价）', '定制设备', '定制桌椅', '人员培训', '办理证件', '装修验收', '物料报货', '安装收银机', '安装调试设备', '开业营销宣传', '试营业'],
            days: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
        }
    };
})();
