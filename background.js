/** @type browser.tabs._QueryQueryInfo[] */
let currentTab;
/** @type number[] */
let duplicates = [];
/** @type number[] */
let removed = [];

const NOTIFICATION_ID = "duplicate-tab-remover";

async function listener() {
	currentTab = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });

	if (currentTab.length !== 1) return;

	duplicates.splice(0);

	if (currentTab[0].url.startsWith("http")) {
		const tabs = await browser.tabs.query({
			url: currentTab[0].url
		});

		for (const tab of tabs) {
			if (tab.id === currentTab[0].id || removed.includes(tab.id)) continue;

			duplicates.push(tab.id);

			console.log("Duplicate:", tab.id, tab.url);
		}
	}

	browser.action.setBadgeText({
		text: duplicates.length > 0 ? String(duplicates.length) : ""
	});

	currentTab = null;

	removed.splice(0);
}

browser.tabs.onActivated.addListener(listener);
browser.tabs.onUpdated.addListener(listener);
browser.windows.onFocusChanged.addListener(listener);

browser.tabs.onRemoved.addListener(function (tabId) {
	removed.push(tabId);
});

browser.action.onClicked.addListener(async () => {
	if (duplicates.length > 0) {
		await browser.tabs.remove([...new Set(duplicates)]);
		browser.notifications.clear(NOTIFICATION_ID);
		browser.notifications.create(NOTIFICATION_ID, {
			type: "basic",
			title: "Duplicate tab remover",
			message: `Closed ${ duplicates.length } duplicate tab${ duplicates.length > 1 ? "s" : "" }`,
			iconUrl: browser.runtime.getURL("trash.svg")
		});
		browser.action.setBadgeText({ text: "" });
	}
});
