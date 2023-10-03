/// <reference types="npm:@types/firefox-webext-browser" />

/** @type browser.tabs.Tab[] */
const duplicates = [];
/** @type number[] */
const removed = [];

const NOTIFICATION_ID = "duplicate-tab-remover";

function refresh() {
	browser.tabs.query({
		active: true,
		// status: "complete",
		pinned: false,
		windowId: browser.windows.WINDOW_ID_CURRENT,
	})
		.then(async (currentTab) => {
			duplicates.splice(0);

			if (
				currentTab !== null &&
				currentTab[0] &&
				currentTab[0].url.startsWith("http")
			) {
				const tabs = await browser.tabs.query({
					url: currentTab[0].url.replace(/#.+/, ""),
				});

				for (const tab of tabs) {
					if (tab.id === currentTab[0].id || removed.includes(tab.id)) {
						continue;
					}

					if (!await autoRemover(tab)) {
						duplicates.push(tab);
					}

					console.log("Duplicate:", tab.id, tab.url);
				}
			}
		})
		.finally(() => {
			browser.action.setBadgeText({
				text: duplicates.length > 0 ? String(duplicates.length) : "",
			});
			removed.splice(0);
		});
}

/**
 * @param {browser.tabs.Tab} tab
 */
async function autoRemover(tab) {
	if (tab.url.includes("pbs.twimg")) {
		return await removeTabs([tab]), true;
	}
	return false;
}

browser.tabs.onActivated.addListener(function () {
	refresh();
});

browser.tabs.onUpdated.addListener(function (_, changeInfo) {
	if (changeInfo.status === "loading" && changeInfo.url !== undefined) {
		refresh();
	}
});

browser.windows.onFocusChanged.addListener(function (windowId) {
	if (windowId === -1) {
		return;
	}
	refresh();
});

browser.tabs.onRemoved.addListener(function (tabId) {
	removed.push(tabId);
});

browser.action.onClicked.addListener(function () {
	if (duplicates.length > 0) {
		removeTabs(duplicates);
	}
});

/**
 * @param {browser.tabs.Tab[]} tabs
 */
async function removeTabs(tabs) {
	/** @type Set<number> */
	const tabIds = new Set();
	for (const tab of tabs) {
		console.log("Closing:", tab.id, tab.url);
		tabIds.add(tab.id);
	}
	await browser.tabs.remove([...tabIds]);
	browser.notifications.clear(NOTIFICATION_ID);
	browser.notifications.create(NOTIFICATION_ID, {
		type: "basic",
		title: "Duplicate tab remover",
		message: `Closed ${tabIds.size} duplicate tab${tabIds.size > 1 ? "s" : ""}`,
		iconUrl: browser.runtime.getURL("trash.svg"),
	});
	browser.action.setBadgeText({ text: "" });
}
