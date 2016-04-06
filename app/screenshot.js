var page = new WebPage(),
    address, outfile, width, height, clip_height;

address = phantom.args[0];
outfile = phantom.args[1];
width = phantom.args[2];
clip_height = height = phantom.args[3];

page.viewportSize = { width: width, height: height };
page.clipRect = { width: width, height: clip_height };

page.open(address, function (status) {
  if (status !== 'success') {
    phantom.exit(1);
  } else {
    window.setTimeout(function () {
		page.render(outfile);
		page.close();
		phantom.exit();
	}, 1000);
  }
});

page.onError = function(msg, trace) {

  var msgStack = ['ERROR: ' + msg];

  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }

  console.error(msgStack.join('\n'));

};