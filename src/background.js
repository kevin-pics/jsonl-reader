const JSONL_URL_PATTERN = /\.(jsonl|ndjson)([?#].*)?$/i;
const HTTP_JSONL_RULE_ID = 1;

function isJsonlUrl(url) {
  try {
    return JSONL_URL_PATTERN.test(new URL(url).pathname + new URL(url).search + new URL(url).hash);
  } catch {
    return false;
  }
}

async function registerRedirectRules() {
  const viewerUrl = chrome.runtime.getURL('viewer.html?url=\\1');

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [HTTP_JSONL_RULE_ID],
    addRules: [
      {
        id: HTTP_JSONL_RULE_ID,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            regexSubstitution: viewerUrl
          }
        },
        condition: {
          regexFilter: '^(https?://[^#]*\\.(jsonl|ndjson)(?:[?#].*)?)$',
          resourceTypes: ['main_frame']
        }
      }
    ]
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerRedirectRules().catch(console.error);
});

chrome.runtime.onStartup.addListener(() => {
  registerRedirectRules().catch(console.error);
});

registerRedirectRules().catch(console.error);

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0 || details.tabId < 0) return;
  if (!details.url.startsWith('file://') || !isJsonlUrl(details.url)) return;

  chrome.tabs.update(details.tabId, {
    url: chrome.runtime.getURL(`viewer.html?encodedUrl=${encodeURIComponent(details.url)}`)
  });
});
