browser.browserAction.onClicked.addListener(async () => {
	const currentTab = await browser.tabs.query({ active: true, windowId: browser.windows.WINDOW_ID_CURRENT });

	if (currentTab.length !== 1) return;

	const tabs = await browser.tabs.query({
		url: currentTab[0].url
	});

	const remove = [];

	for (const tab of tabs) {
		if (tab.id === currentTab[0].id) continue;
		remove.push(tab.id);
		console.log("Removing:", tab.id, tab.url);
	}

	if (remove.length > 0) {
		await browser.tabs.remove([...new Set(remove)]);

		browser.notifications.create({
			type: "basic",
			title: "Duplicate tab remover",
			message: `Closed ${ remove.length } duplicate tab${remove.length > 1 ? "s" : ""}`,
			iconUrl: browser.runtime.getURL("trash.svg")
		});
	}
});
