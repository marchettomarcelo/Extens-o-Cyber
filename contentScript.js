// Função que será injetada na página
function detectCanvasFingerprinting() {
	(function () {
		let canvasFingerprintingDetected = false;

		const methodsToOverride = ["toDataURL", "toBlob", "getImageData", "measureText", "strokeText", "fillText"];

		methodsToOverride.forEach(function (method) {
			if (HTMLCanvasElement.prototype.hasOwnProperty(method)) {
				const originalMethod = HTMLCanvasElement.prototype[method];
				HTMLCanvasElement.prototype[method] = function () {
					canvasFingerprintingDetected = true;
					console.log(`Canvas method called: ${method}`);
					document.dispatchEvent(new CustomEvent("canvasFingerprintingDetected"));
					return originalMethod.apply(this, arguments);
				};
			} else if (CanvasRenderingContext2D.prototype.hasOwnProperty(method)) {
				const originalMethod = CanvasRenderingContext2D.prototype[method];
				CanvasRenderingContext2D.prototype[method] = function () {
					canvasFingerprintingDetected = true;
					console.log(`Canvas method called: ${method}`);
					document.dispatchEvent(new CustomEvent("canvasFingerprintingDetected"));
					return originalMethod.apply(this, arguments);
				};
			}
		});
	})();
}

// Injetar a função na página
const script = document.createElement("script");
script.textContent = `(${detectCanvasFingerprinting.toString()})();`;
(document.head || document.documentElement).appendChild(script);
script.remove();

// Variável para armazenar a detecção
let canvasFingerprintingDetected = false;

// Ouvir o evento disparado pela página
document.addEventListener("canvasFingerprintingDetected", () => {
	canvasFingerprintingDetected = true;
});

// Coletar dados de localStorage como antes
let localStorageUsed = false;
let localStorageData = {};
try {
	if (localStorage.length > 0) {
		localStorageUsed = true;
		for (let i = 0; i < localStorage.length; i++) {
			let key = localStorage.key(i);
			let value = localStorage.getItem(key);
			localStorageData[key] = value;
		}
	} else {
		localStorage.setItem("test_key", "test_value");
		if (localStorage.getItem("test_key") === "test_value") {
			localStorageUsed = true;
			localStorage.removeItem("test_key");
		}
	}
} catch (e) {
	// localStorage não acessível
}

// Enviar os dados após um pequeno atraso
setTimeout(() => {
	browser.runtime
		.sendMessage({
			type: "contentData",
			localStorageUsed,
			localStorageData,
			canvasFingerprintingDetected,
		})
		.then(() => {
			console.log("Dados enviados do content script:", {
				localStorageUsed,
				localStorageData,
				canvasFingerprintingDetected,
			});
		})
		.catch((error) => {
			console.error("Erro ao enviar mensagem do content script:", error);
		});
}, 1500);
