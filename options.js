// 页面加载时，获取并设置已保存的配置
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['requestTemplate', 'menuTitle', 'iconUrl'], function(data) {
        if (data.requestTemplate) {
            document.getElementById('requestTemplate').value = data.requestTemplate;
        }
        if (data.menuTitle) {
            document.getElementById('menuTitle').value = data.menuTitle;
        }
    });
});


document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();

    var requestTemplate = document.getElementById('requestTemplate').value;
    var menuTitle = document.getElementById('menuTitle').value;

    chrome.storage.local.set({requestTemplate, menuTitle}, function() {
        console.log('设置已保存。');
    });
});