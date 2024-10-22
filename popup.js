document.addEventListener("DOMContentLoaded", () => {
	// Obter a aba ativa
	browser.tabs
		.query({ active: true, currentWindow: true })
		.then((tabs) => {
			if (tabs.length > 0) {
				let activeTab = tabs[0];
				let tabId = activeTab.id;
				let url = activeTab.url;

				// Enviar mensagem ao background com o tabId
				browser.runtime
					.sendMessage({ type: "getData", tabId: tabId })
					.then((response) => {
						console.log("Resposta recebida do background:", response);

						const content = document.getElementById("content");
						content.innerHTML = "";

						// Chamar a função para obter os cookies
						getCookies(url, content, response);
					})
					.catch((error) => {
						console.error("Erro ao enviar mensagem:", error);
					});
			} else {
				console.error("Nenhuma aba ativa encontrada.");
			}
		})
		.catch((error) => {
			console.error("Erro ao obter a aba ativa:", error);
		});
});

// Função para obter os cookies
function getCookies(url, content, response) {
	let domain = new URL(url).hostname;

	browser.cookies
		.getAll({ domain: domain })
		.then((cookies) => {
			let firstPartyCookies = 0;
			let thirdPartyCookies = 0;
			let sessionCookies = 0;
			let persistentCookies = 0;
			let supercookies = 0;

			cookies.forEach((cookie) => {
				// Verifica se o cookie é de sessão ou persistente
				if (cookie.session) {
					sessionCookies++;
				} else {
					persistentCookies++;
				}

				// Verifica se é supercookie
				if (cookie.domain.startsWith(".")) {
					supercookies++;
				}

				// Verifica se é cookie de terceira parte
				if (cookie.domain.includes(domain)) {
					firstPartyCookies++;
				} else {
					thirdPartyCookies++;
				}
			});

			// Atualiza o HTML dos cookies
			let cookiesHTML = "<h2>Cookies</h2>";
			cookiesHTML += `<p>Cookies de Primeira Parte: ${firstPartyCookies}</p>`;
			cookiesHTML += `<p>Cookies de Terceira Parte: ${thirdPartyCookies}</p>`;
			cookiesHTML += `<p>Cookies de Sessão: ${sessionCookies}</p>`;
			cookiesHTML += `<p>Cookies Persistentes: ${persistentCookies}</p>`;
			cookiesHTML += `<p>Supercookies: ${supercookies}</p>`;

			// Adiciona o conteúdo dos cookies
			content.innerHTML += cookiesHTML;

			// Adiciona os outros conteúdos (conexões, hijacking, etc.)
			addOtherContents(content, response);
		})
		.catch((error) => {
			console.error("Erro ao obter cookies:", error);
		});
}

// Função para adicionar os outros conteúdos
function addOtherContents(content, response) {
	console.log("Adicionando outros conteúdos:", response);

	// Conexões de terceira parte
	let thirdPartyHTML = "<h2>Conexões de Terceira Parte</h2>";
	if (response.thirdPartyConnections && response.thirdPartyConnections.length > 0) {
		thirdPartyHTML += "<ul>";
		response.thirdPartyConnections.forEach((domain) => {
			thirdPartyHTML += `<li>${domain}</li>`;
		});
		thirdPartyHTML += "</ul>";
	} else {
		thirdPartyHTML += "<p>Nenhuma conexão de terceira parte detectada.</p>";
	}

	// Ameaças de Hijacking
	let hijackingHTML = "<h2>Ameaças de Hijacking</h2>";
	hijackingHTML += `<p>${response.potentialHijacking ? '<span class="alert">Potencial ameaça detectada!</span>' : "Nenhuma ameaça detectada."}</p>`;

	// Armazenamento Local
	let storageHTML = "<h2>Armazenamento Local</h2>";
	if (response.contentData && response.contentData.localStorageUsed) {
		storageHTML += "<p>Dados armazenados no <strong>localStorage</strong>:</p>";
		storageHTML += "<ul>";
		for (let key in response.contentData.localStorageData) {
			let value = response.contentData.localStorageData[key];
			storageHTML += `<li><strong>${key}:</strong> ${value}</li>`;
		}
		storageHTML += "</ul>";
	} else {
		storageHTML += "<p>Nenhum dado armazenado no <strong>localStorage</strong>.</p>";
	}

	// Canvas Fingerprinting
	let canvasHTML = "<h2>Canvas Fingerprinting</h2>";
	canvasHTML += `<p>${response.contentData && response.contentData.canvasFingerprintingDetected ? '<span class="alert">Canvas Fingerprinting detectado!</span>' : "Nenhum Canvas Fingerprinting detectado."}</p>`;

	// Adiciona os conteúdos ao popup
	content.innerHTML += thirdPartyHTML + hijackingHTML + canvasHTML + storageHTML;
}
