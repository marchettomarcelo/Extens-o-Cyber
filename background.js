// Armazena dados das conexões de terceira parte
let thirdPartyConnections = {};

// Armazena dados de possíveis ameaças de hijacking
let potentialHijacking = {};

// Armazena dados recebidos do content script
let contentData = {};

// Monitora as requisições de rede para detectar conexões de terceira parte
browser.webRequest.onBeforeRequest.addListener(
	(details) => {
		let url = new URL(details.url);
		let tabId = details.tabId;
		if (tabId >= 0) {
			browser.tabs
				.get(tabId)
				.then((tab) => {
					if (tab && tab.url) {
						let tabUrl = new URL(tab.url);
						if (url.hostname !== tabUrl.hostname) {
							if (!thirdPartyConnections[tabId]) {
								thirdPartyConnections[tabId] = new Set();
							}
							thirdPartyConnections[tabId].add(url.hostname);
						}

						// Detecta potenciais ameaças de hijacking
						if (details.type === "script" && url.hostname !== tabUrl.hostname) {
							potentialHijacking[tabId] = true;
						}
					}
				})
				.catch((error) => {
					console.error("Erro ao obter a aba no onBeforeRequest:", error);
				});
		}
	},
	{ urls: ["<all_urls>"] },
	[]
);

// Recebe mensagens do content script e do popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "contentData" && sender.tab && sender.tab.id !== undefined) {
		let tabId = sender.tab.id;
		contentData[tabId] = {
			localStorageUsed: message.localStorageUsed,
			localStorageData: message.localStorageData,
			canvasFingerprintingDetected: message.canvasFingerprintingDetected,
		};
		console.log("Dados recebidos do content script:", contentData[tabId]);
	} else if (message.type === "getData" && message.tabId !== undefined) {
		let tabId = message.tabId;
		let responseData = {
			thirdPartyConnections: Array.from(thirdPartyConnections[tabId] || []),
			potentialHijacking: potentialHijacking[tabId] || false,
			contentData: contentData[tabId] || {
				localStorageUsed: false,
				localStorageData: {},
				canvasFingerprintingDetected: false,
			},
		};
		console.log("Enviando dados ao popup:", responseData);
		sendResponse(responseData);
		// Retorna true para indicar resposta assíncrona
		return true;
	}
});

// Limpa os dados quando a aba é fechada
browser.tabs.onRemoved.addListener((tabId) => {
	delete thirdPartyConnections[tabId];
	delete potentialHijacking[tabId];
	delete contentData[tabId];
});
