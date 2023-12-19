chrome.runtime.onInstalled.addListener(function() {
    // 当插件安装时，添加右键菜单选项
    chrome.contextMenus.create({
        id: "sendRequest",
        title: "发送请求",
        contexts: ["selection", "page"]
    });
    // 更新菜单项的标题和图标
    updateContextMenu();
});

function updateContextMenu() {
    chrome.storage.local.get(['menuTitle'], function(data) {
        var title = data.menuTitle || '发送请求';

        chrome.contextMenus.update("sendRequest", {
            title: title
        });
    });
}

// 在设置更改时更新菜单
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
        if (key === 'menuTitle') {
            updateContextMenu();
        }
    }
});

function parseCurlCommand(curlCommand) {
    let url, method = 'GET', headers = {}, data;

    // 如果存在 --data 或 -d 参数，设置默认请求方法为 POST
    if (curlCommand.includes('--data ') || curlCommand.includes(' -d ')) {
        method = 'POST';
    }

    // 匹配请求方式（如果显式指定）
    let methodMatch = curlCommand.match(/-X\s(\w+)/) || curlCommand.match(/--request\s(\w+)/);
    if (methodMatch) {
        method = methodMatch[1];
    }

    // 匹配URL
    let urlMatch = curlCommand.match(/'([^']*)'/);
    if (urlMatch) {
        url = urlMatch[1];
    }

    // 匹配Headers
    let headerMatches = [...curlCommand.matchAll(/--header '([^:]*): ([^']*)'/g)];
    headerMatches.forEach(match => {
        headers[match[1]] = match[2];
    });

    // 匹配Data
    let dataMatch = curlCommand.match(/--data '([^']*)'/);
    if (dataMatch) {
        data = dataMatch[1];
    }

    return { url, method, headers, data };
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    chrome.storage.local.get(['requestTemplate'], function(data) {
        let { url, method, headers, data: requestData } = parseCurlCommand(data.requestTemplate);
        Object.keys(urlFixRule).forEach(baseURL => {
            if (tab.url.startsWith(baseURL)) {
                tab.url = urlFixRule[baseURL](tab.url);
            }
        });
        // 替换占位符
        requestData = requestData.replace(/\$text\$/, info.selectionText || '')
                                 .replace(/\$title\$/, tab.title)
                                 .replace(/\$url\$/, tab.url);

        // 准备fetch选项
        let fetchOptions = {
            method: method,
            headers: headers
        };

        // 仅当方法不是GET或HEAD时，添加body
        if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
            fetchOptions.body = requestData;
        }

        // 发送请求
        fetch(url, fetchOptions)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // 显示发送成功的通知
            chrome.notifications.create('', { // 确保使用 '' 作为第一个参数，创建一个唯一ID的通知
                type: 'basic',
                iconUrl: 'logo.png', // 替换为您的图标地址
                title: '请求发送成功',
                message: '您的请求已成功发送并接收。'
            });
        })
        .catch(error => {
            console.error('Error:', error);
            // 可以选择在发送失败时显示通知
            chrome.notifications.create('', { // 确保使用 '' 作为第一个参数，创建一个唯一ID的通知
                type: 'basic',
                iconUrl: 'logo.png', // 替换为您的图标地址
                title: '请求发送失败',
                message: '发送请求时发生错误。'
            });
        });
    });
});

const urlFixRule = {
    "https://blog.csdn.net/sumatch/article/details/": (url) => {
        return url.split("?")[0];
    },
    "https://www.bilibili.com/video/": (url) => {
        return url.split("?")[0];
    }
};