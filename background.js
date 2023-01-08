/** @type browser.tabs._QueryQueryInfo[] */
let currentTab;
/** @type number[] */
let duplicates = [];

browser.tabs.onActivated.addListener(async function () {
	currentTab = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });

	if (currentTab.length !== 1) return;

	if (!currentTab[0].url.startsWith("http")) return;

	const tabs = await browser.tabs.query({
		url: currentTab[0].url
	});

	duplicates.splice(0);
	browser.browserAction.setBadgeText({ text: "" });

	for (const tab of tabs) {
		if (tab.id === currentTab[0].id) continue;

		duplicates.push(tab.id);

		console.log("Duplicate:", tab.id, tab.url);
	}

	if (duplicates.length > 0) {
		browser.browserAction.setBadgeText({ text: String(duplicates.length) });
	}

	currentTab = null;
});

browser.browserAction.onClicked.addListener(async () => {
	if (duplicates.length > 0) {
		await browser.tabs.remove([...new Set(duplicates)]);

		browser.notifications.create({
			type: "basic",
			title: "Duplicate tab remover",
			message: `Closed ${ duplicates.length } duplicate tab${ duplicates.length > 1 ? "s" : "" }`,
			iconUrl: browser.runtime.getURL("trash.svg")
		});

		browser.browserAction.setBadgeText({ text: "" });
	}
});
