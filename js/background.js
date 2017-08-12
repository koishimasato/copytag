chrome.extension.onMessage.addListener(copySelection);

function copySelection(req, sender, callback) {
  var rv, el, i, len, range, s, resp = {};

  if (req.type === "asLink") {
    if (req.text && req.text.length > 0) {
      /* text = '<a title="' + req.title + '" href="' + req.href + */
      /*   '">' + req.text + '</a>';                               */
      /* text = "[" + req.title + "](" + req.href + ")\n" + req.text + "\n"; */

      text = req.text;

      el = document.createElement('div');
      el.innerText = text;
      el.contentEditable='true';
      document.body.appendChild(el);
      el.unselectable = 'off';
      el.focus();

      console.info(el);

      document.execCommand('SelectAll');
      rv = document.execCommand("copy");

      console.log(req);
      sendSelection(req);

      document.body.removeChild(el);
    }

  } else if (req.type === "reformat") {
    if (req.text && req.text.length > 0) {
      el = document.createElement('textarea');
      document.body.appendChild(el);
      el.value = req.text;
      el.select();
      //console.log("textArea value: " + el.value);
      rv = document.execCommand("copy");
      //console.log("Copy: " + rv);
      document.body.removeChild(el);
    }
  }
}

var tagMemoUrl = "http://localhost:5000/cards";

function sendSelection(req) {
  var card = {
    title: req.title,
    url: req.href,
    text: req.text,
    parent: req.parent,
  }
  axios.post(tagMemoUrl, { card: card }).then((res) => {
    console.info(res);
  }).catch((error) => {
    console.error(error);
  });
}
