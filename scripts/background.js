'use strict';

//  Copyright (c) 2016 Christopher Kalafarski.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

var _store = {};

const filter = { urls: ['http://*/*', 'https://*/*'], types: ['main_frame'] };
const rxExtra = ['responseHeaders'];
const txExtra = ['requestHeaders'];

function rxCallback(details) {
  _store[details.tabId].push(details);
  updateBadge(details.tabId);
}

function txCallback(details) {
  if (!_store.hasOwnProperty(details.tabId) ||
        _store[details.tabId][0].requestId !== details.requestId) {
    _store[details.tabId] = [];
  }

  _store[details.tabId].push(details);
}

function updateBadge(tabId) {
  const details = _store[tabId];
  const lastDetails = details[details.length - 1];

  let color = '#3B3B3B';

  if (lastDetails.statusCode >= 500) {
    color = '#BA0000';
  } else if (lastDetails.statusCode >= 400) {
    color = '#DE5500';
  } else if (lastDetails.statusCode >= 300) {
    color = '#0062A3';
  } else if (lastDetails.statusCode >= 200) {
    color = '#078F00';
  }

  let text = '•';
  if (lastDetails.statusCode) { text = `${lastDetails.statusCode}` }

  // If there's more than two details, it means a single request and response
  // wasn't enough; probably a redirect. Indicate how many total roundtrips were
  // needed
  if (details.length > 2) {
    text = `× ${Math.round(details.length / 2)}`;
  }

  chrome.browserAction.setBadgeBackgroundColor({color: color, tabId: tabId});
  chrome.browserAction.setBadgeText({text: text, tabId: tabId});
}

chrome.webRequest.onHeadersReceived.addListener(rxCallback, filter, rxExtra);
chrome.webRequest.onSendHeaders.addListener(txCallback, filter, txExtra);

chrome.tabs.onUpdated.addListener(tabId => updateBadge(tabId));
chrome.tabs.onActivated.addListener(info => updateBadge(info.tabId));
chrome.tabs.onRemoved.addListener(tabId => delete(_store[tabId]));
