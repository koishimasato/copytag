var opts = {
  'init'                          : false,
  'alertOnCopy'                   : true,
  'removeSelectionOnCopy'         : false,
  'enableForTextBoxes'            : true,
  'pasteOnMiddleClick'            : false,
  'ctrlToDisable'                 : false,
  'ctrlToDisableKey'              : 'ctrl',
  'altToCopyAsLink'               : false,
  'copyAsLink'                    : true,
  'copyAsPlainText'               : false,
  'includeUrl'                    : true,
  'prependUrl'                    : true,
  'includeUrlText'                : "",
  'includeUrlCommentCountEnabled' : true,
  'includeUrlCommentCount'        : 5,
  'mouseDownTarget'               : null,
  'blackList'                     : "",
  'enableDebug'                   : true,
};

chrome.extension.sendMessage(
  {
    "type" : "config",
    "keys" : [
      "enableForTextBoxes", "pasteOnMiddleClick", "copyAsPlainText",
      "ctrlToDisable", "copyAsLink", "includeUrl", "prependUrl",
      "includeUrlText", "removeSelectionOnCopy", "altToCopyAsLink",
      "ctrlToDisableKey", "alertOnCopy",
      "includeUrlCommentCountEnabled", "includeUrlCommentCount", "blackList"
    ]
  },
  function (resp) {
    debug("Got sendMessage response: " + resp);
    opts.init = true;

    var href = window.location.href;
    var arr  = window.location.hostname.split(".");
    if (arr.length <= 0) {
      debug("window.location.hostname is empty");
      return;
    }

    debug("window.location.href is " + href);

    var domain;
    var flag = false;
    for (i in arr) {
      if (arr.length < 2) {
        break;
      }
      domain = arr.join(".");
      debug("Domain walk: " + domain);
      if (opts.blackList[domain] == 1) {
        flag = true;
        break;
      }
      arr.shift();
    }

    if (!domain) {
      debug("Domain is undefined: " + window.location.hostname);
      return;
    }

    if (!flag) {
      debug("Extension enabled for " + domain);
      document.body.addEventListener("mouseup", autoCopy, false);
      document.body.addEventListener(
        "mousedown",
        function (e) {
          opts.mouseDownTarget = e.target;
        },
        false
      );
    } else {
      debug("URL is blacklisted, disabling: " + domain);
    }
  }
);

function debug(text) {
  if (opts.enableDebug) {
    console.debug("Copy-Tag (debug): " + text);
  }
}

function fade(el, speed) {
  var timer;
  if (el.style) {
    el.style.opacity= '1';
  }
  timer = setInterval(function () {
    el.style.opacity = parseFloat(el.style.opacity) - .02;
    if (el.style.opacity <= 0) {
      clearInterval(timer);
      document.body.removeChild(el);
    }
  },
    speed);
}

function alertOnCopy() {
  var el;
  if (opts.alertOnCopy) {
    el = document.createElement('div');
    el.innerHTML             = "Auto Copied";
    el.style.position        = 'fixed';
    el.style.boxSizing       = 'content-box';
    el.style.height          = '12px';
    el.style.width           = '70px';
    el.style.bottom          = '5px'
    el.style.right           = '5px';
    el.style.textAlign       = 'center';
    el.style.fontFamily      = 'Helvetica, sans-serif';
    el.style.fontStyle       = 'normal';
    el.style.fontWeight      = 'normal';
    el.style.fontSize        = '12px';
    el.style.backgroundColor = '#FFFF5C';
    el.style.padding         = '4px';
    el.style.margin          = '0px';
    el.style.lineHeight      = '12px';
    el.style.borderRadius    = '4px';
    el.style.boxShadow       = '0px 0px 7px 0px #818181';
    el.style.border          = '1px solid #FAD42E';
    el.style.zIndex          = '100000001';

    document.body.appendChild(el);

    setTimeout(function () {
      fade(el, 5);
    }, 400);
  }
}

function includeComment(params) {
  params = params || {};

  console.info(params);

  if (!params.text) {
    debug("includeComment: No text supplied");
    return;
  }

  var text;
  var count   = (params.text.split(/\s+/)).length;
  var comment = '', flag = true, url = '';
  var crlf    = (opts.copyAsPlainText) ? "\n" : "<br>";

  console.info(count, comment, crlf);

  if (
    opts.includeUrlCommentCountEnabled &&
    count <= opts.includeUrlCommentCount
  ) {
    debug("Setting comment flag to false");
    flag = false;
  }

  if (opts.includeUrl && opts.includeUrlText && flag) {
    comment = opts.includeUrlText;
    debug("Format: " + comment);

    if (opts.includeUrlText.indexOf('$title') >= 0) {
      comment = comment.replace(/\$title/g, document.title);
    }

    if (opts.copyAsPlainText) {
      url = window.location.href;
    } else {
      comment = comment.replace(/</g, "&lt;");
      comment = comment.replace(/>/g, "&gt;");
      url = '<a title="' + document.title + '" href="' + window.location.href +
        '">' + window.location.href + '</a>';
    }

    if (opts.includeUrlText.indexOf('$url') >= 0) {
      comment = comment.replace(/\$url/g, url);
    }

    if (opts.includeUrlText.indexOf('$crlf') >= 0) {
      comment = comment.replace(/\$crlf/g, crlf);
    }

    if (params.merge) {
      if (opts.prependUrl) {
        debug("Prepending comment: " + comment);
        text = comment + crlf + params.text;
      } else {
        debug("Postpending comment: " + comment);
        text = params.text + crlf + comment;
      }
    } else {
      text = comment;
    }

    return(text);
  }

  return(params.text);
}

function copyAsPlainText() {
  var s, text;
  try {
    s = window.getSelection();
    text = s.toString();

    if (text.length <= 0) {
      debug("Selection was empty");
      return;
    }

    debug("Got selectection: " + text);

    if (opts.includeUrl) {
      text = includeComment({ 'text' : text, 'merge' : true });
    }

    debug("Sending copy as plain text: " + text);
    chrome.extension.sendMessage({
      "type" : "reformat",
      "text" : text,
    });
  } catch (ex) {
    debug("Caught exception: " + ex);
  }
}

function autoCopy(e) {
  var rv, el, s, text;

  debug("Detected a mouse event");
  if (opts.enableDebug) {
    console.debug(opts);
  }

  if (
    opts.ctrlToDisable
    && ((opts.ctrlToDisableKey === 'ctrl' && e.ctrlKey)
      || (opts.ctrlToDisableKey === 'shift' && e.shiftKey))
  ) {
    debug("Ctrl/shift was active disabling");
    return;
  }

  if (
    !opts.enableForTextBoxes &&
    opts.mouseDownTarget &&
    opts.mouseDownTarget.nodeName &&
    (opts.mouseDownTarget.nodeName === "INPUT" ||
      opts.mouseDownTarget.nodeName === "TEXTAREA")
  ){
    debug("Extension is not enabled for text boxes");
    return;
  }

  s = window.getSelection();
  console.log(s);
  console.log(s.anchorNode.parentNode.innerHTML);

  text = s.toString();
  if (text.length <= 0) {
    debug("No selection");
    return;
  }

  try {
    if (opts.copyAsLink || (opts.altToCopyAsLink && e.altKey)) {
      debug("performing copy as link");
      chrome.extension.sendMessage({
        "type"  : "asLink",
        "text"  : text,
        "parent": s.anchorNode.parentNode.innerHTML,
        "href"  : window.location.href,
        "title" : document.title,
      });
    } else if (opts.copyAsPlainText) {
      debug("performing copy as plain text");
      copyAsPlainText();
    } else if (opts.includeUrl) {
      debug("performing copy with comment");
      rv = document.execCommand("copy");
      if (rv) {
        text = includeComment({
          'text'  : text,
          'merge' : false,
        });
        debug("Got comment: " + text);
        chrome.extension.sendMessage({
          "type"    : "includeComment",
          "comment" : text,
          "opts"    : opts
        });
      } else {
        debug("Falling back to plain text copy");
        opts.copyAsPlainText = true;
        copyAsPlainText();
        opts.copyAsPlainText = false;
      }
    } else {
      debug("executing copy");
      rv = document.execCommand("copy");
      debug("copied: " + rv);

      if (!rv) {
        debug("Falling back to plain text copy");
        opts.copyAsPlainText = true;
        copyAsPlainText();
        opts.copyAsPlainText = false;
      }
    }

    alertOnCopy();
  } catch (ex) {
    debug("Caught exception: " + ex);
  }

  return;
}
