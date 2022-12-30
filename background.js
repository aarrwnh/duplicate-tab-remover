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

	console.log([...new Set(remove)]);

	await browser.tabs.remove([...new Set(remove)]);
});
