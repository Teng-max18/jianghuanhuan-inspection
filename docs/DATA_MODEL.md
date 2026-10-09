# 数据结构与业务关系

状态对象的 schemaVersion 为 2，统一保存于浏览器 IndexedDB 的 records 表、state 键。
IndexedDB 无法使用时尝试 localStorage。更新采用复制状态、校验、成功写入后替换界面状态的顺序。

| 集合 | 核心字段 | 关系 |
| --- | --- | --- |
| stores | id、name、brand、status、manager、address、targets | 门店主数据 |
| inspections | id、storeId、date、inspector、checks、summary、photos | 关联门店；照片为压缩JPEG data URL |
| issues | id、storeId、inspectionId、description、owner、deadline、status、solution | 关联门店，可选关联巡店 |
| personnel | id、name、role、status、storeId、phone、hireDate、history | 可分配门店；调配时保存前后门店名称 |
| supports | id、storeId、mentor、stages、training、nextPlan、openingDate | 关联门店，stages 包含14项 |
| reports | id、start、end、summary、problems、newStoreProgress、ordersTotal、dayPlans | 独立文本快照，不依赖门店后续修改 |
| settings | name、company、department | 生成巡店/周报时的默认资料 |

## 完整备份

```json
{
    "format": "jianghuanhuan-inspection",
    "appVersion": "2.0.0",
    "exportedAt": "ISO 时间",
    "data": {
        "schemaVersion": 2,
        "stores": [],
        "inspections": [],
        "issues": [],
        "personnel": [],
        "supports": [],
        "reports": [],
        "settings": {},
        "updatedAt": "ISO 时间"
    }
}
```

这只是结构示意。导入须使用应用导出的真实备份，不能把示意JSON直接导入。
校验会检查表结构、重复ID、关联门店、关联巡店、日期、状态、人数、照片格式、文本字段和数值。

## 删除规则

- 门店已有巡店、问题、人员或帮扶关联时，阻止删除，建议设置为暂停营业。
- 删除巡店保留关联整改，只清空其 inspectionId。
- 删除人员会删除该人的调配历史；保留离职记录可改状态而不删除。
- 已保存周报不会跟随业务记录自动变化。

## 设备与来源

数据按浏览器网站来源隔离。文件路径、localhost、GitHub HTTPS 域名不会共享同一份数据库。
请使用固定生产网址并定期完整备份。同一应用不建议同时在多个标签页录入。
所有显示文本通过HTML转义，导出的CSV会防止用户文本被Excel解释为公式。
系统不发送录入的业务数据到外部API。
