var textarea;

function sce_is(node, selector) {
	var result = false;

	if (node && node.nodeType === 1) {
		result = (node.matches || node.msMatchesSelector ||
			node.webkitMatchesSelector).call(node, selector);
	}

	return result;
}

function sce_on(node, events, selector, fn, capture) {
	events.split(' ').forEach(function (event) {
		function isTypeof(type, arg) {
			return typeof arg === type;
		}

		var isString = isTypeof.bind(null, 'string');
		var handler;

		if (isString(selector)) {
			handler = fn['_sce-event-' + event + selector] || function (e) {
				var target = e.target;
				while (target && target !== node) {
					if (sce_is(target, selector)) {
						fn.call(target, e);
						return;
					}

					target = target.parentNode;
				}
			};

			fn['_sce-event-' + event + selector] = handler;
		} else {
			handler = selector;
			capture = fn;
		}

		node.addEventListener(event, handler, capture || false);
	});
}

function sce_createElement(tag, attributes, context) {
	var node = (context || document).createElement(tag);

	sceditor.utils.each(attributes || {}, function (key, value) {
		if (key === 'style') {
			node.style.cssText = value;
		} else if (key in node) {
			node[key] = value;
		} else {
			node.setAttribute(key, value);
		}
	});

	return node;
}


// Fix for php 3.2.7+
sceditor.formats.bbcode.set('img', {
	format: function (element, content) {
		var attr = sceditor.dom.attr;

		return '[img]' + attr(element, 'src') + '[/img]';
	},
	html: function (token, attrs, content) {
		var escapeUriScheme = sceditor.escapeUriScheme;

		return '<img src="' + escapeUriScheme(content) + '" />';
	}
});

sceditor.command.set('image', {
	_dropDown: function (editor, caller, selected, cb) {
		var child = document.createElement('div');
		child.innerHTML = '<div><label for="link">' + editor._('URL:') + '</label> ' +
			'<input type="text" id="image" dir="ltr" placeholder="https://" /></div>' +
			'<div><input type="button" class="button" value="' + editor._('Insert') + '" />' +
			'</div>';

		var content = document.createElement('div');
		content.appendChild(child);

		var	urlInput = content.querySelectorAll('#image')[0];
		urlInput.value = selected;

		sce_on(content, 'click', '.button', function (e) {
			if (urlInput.value) {
				cb(urlInput.value);
			}

			editor.closeDropDown(true);
			e.preventDefault();
		});

		editor.createDropDown(caller, 'insertimage', content);
	},
});

sceditor.formats.bbcode.set('size', {
	format: function (element, content) {
		var fontSize,
			sizesIdx = 0,
			size = sceditor.dom.attr(element, 'scefontsize');

		if (!size) {
			fontSize = sceditor.dom.css(element,'fontSize');

			// Most browsers return px value but IE returns 1-7
			if (fontSize.indexOf('px') > -1) {
				// convert size to an int
				fontSize = ~~(fontSize.replace('px', ''));

				if (fontSize > 31) {
					sizesIdx = 6;
				}
				else if (fontSize > 23) {
					sizesIdx = 5;
				}
				else if (fontSize > 17) {
					sizesIdx = 4;
				}
				else if (fontSize > 15) {
					sizesIdx = 3;
				}
				else if (fontSize > 12) {
					sizesIdx = 2;
				}
				else if (fontSize > 9) {
					sizesIdx = 1;
				}
			}
			else {
				sizesIdx = ~~fontSize;
			}

			if (sizesIdx > 4) {
				sizesIdx = 4;
			}
			else if (sizesIdx < 0) {
				sizesIdx = 0;
			}

			size = sceFontSizes[sizesIdx];
		}

		return '[size=' + size + ']' + content + '[/size]';
	},
	html: function (token, attrs, content) {
		return '<span data-scefontsize="' + attrs.defaultattr + '" style="font-size:' + attrs.defaultattr + '%">' + content + '</span>';
	}
});

sceditor.command.set('size', {
	_dropDown: function (editor, caller, callback) {
		var fontLabels = ['L_FONT_TINY', 'L_FONT_SMALL', 'L_FONT_NORMAL', 'L_FONT_LARGE', 'L_FONT_HUGE'];
		var content = document.createElement('div');

		sce_on(content, 'click', 'a', function (e) {
			callback($(this).data('size'));
			editor.closeDropDown(true);
			e.preventDefault();
		});

		for (var i = 0; i < 5; i++) {
			if (sceController.isMaxFontsizeSet && sceFontSizes[i] > sceController.getMaxFontsize) {
				break;
			}

			var label = sceFontSizesTexts[ fontLabels[i] ];
			var tmp = document.createElement('div');
			tmp.innerHTML = '<a class="sceditor-fontsize-option" data-size="' + sceFontSizes[i] + '" href="#">' + label + '</a>';

			var	ret = document.createDocumentFragment();
			while (tmp.firstChild) {
				ret.appendChild(tmp.firstChild);
			}

			content.appendChild(ret);
		}

		editor.createDropDown(caller, 'fontsize-picker', content);
	},
	txtExec: function (caller) {
		var editor = this;

		sceditor.command.get('size')._dropDown(
			editor,
			caller,
			function (size) {
				editor.insertText(
					'[size=' + size + ']',
					'[/size]'
				);
			}
		);
	},
	exec: function (caller) {
		var editor = this;

		sceditor.command.get('size')._dropDown(
			editor,
			caller,
			function (fontSize) {
				fontSize = ~~fontSize;
				if (fontSize > 200) {
					fontSize = 200;
				}
				else if (fontSize < 50) {
					fontSize = 50;
				}

				editor.execCommand('fontsize', fontSize);
			}
		);
	}
});

sceditor.command.set('code2', {
	_dropDown: function (editor, caller, callback) {
		var createContent = function (includeMore) {
			var content		= document.createElement('div');
			var line		= sce_createElement('div', {
				className: 'sceditor-color-column'
			});
			var opts		= editor.opts;
			var languageList = sceditor.utils.extend(
				{},
				opts.code.dropdown,
				includeMore ? opts.code.more : {}
			);
			var perLine		= 10;

			content.appendChild(line);
			sce_on(content, 'click', 'a', function (e) {
				var bbcode = $(this).data('code');
				if (bbcode) {
					callback(bbcode);
					editor.closeDropDown(true);
					e.preventDefault();
				}
			});

			sceditor.utils.each(languageList, function (code, label) {
				// parseHTML
				var tmp = document.createElement('div');
				tmp.innerHTML = '<a class="sceditor-fontsize-option" data-code="' + code + '" href="#">' + label + '</a>';

				var	ret = document.createDocumentFragment();
				while (tmp.firstChild) {
					ret.appendChild(tmp.firstChild);
				}

				line.appendChild(ret);
				if (line.children.length >= perLine) {
					line = sce_createElement('div', {
						className: 'sceditor-color-column'
					});
					content.appendChild(line);
				}
			});

			if (!includeMore) {
				var moreLink = sce_createElement('a', {
					className: 'sceditor-more'
				});

				moreLink.appendChild(document.createTextNode(editor._('More')));

				sce_on(moreLink, 'click', function (e) {
					editor.createDropDown(caller, 'more-code-picker', createContent(true));
					e.preventDefault();
				});

				line.appendChild(moreLink);
			}

			return content;
		};

		editor.createDropDown(caller, 'code-picker', createContent(false));
	},
	txtExec: function (caller) {
		var editor = this;

		sceditor.command.get('code2')._dropDown(
			editor,
			caller,
			function (language) {
				editor.insertText(
					'[code2=' + language + ']',
					'[/code2]'
				);
			}
		);
	},
	exec: function (caller) {
		var editor = this;

		sceditor.command.get('code2')._dropDown(
			editor,
			caller,
			function (language) {
				editor.insertText(
					'[code2=' + language + ']',
					'[/code2]'
				);
			}
		);
	},
	tooltip: 'Code',
});

sceditor.formats.bbcode.set('quote', {
	/*
	format: function (element, content) {
		var author = '',
			$element = $(element),
			$cite = $element.children('cite').first();

		if (1 === $cite.length || $element.data('author')) {
			author = $element.data('author') || $cite.text().replace(/(^\s+|\s+$)/g, '').replace(/:$/, '');

			$element.data('author', author);
			$cite.remove();

			content = this.elementToBbcode($element);
			author = '=' + author;

			$element.prepend($cite);
		}

		return '[quote' + author + ']' + content + '[/quote]';
	},
	*/
	html: function (token, attrs, content) {
		var addition = '';

		if ("undefined" !== typeof attrs.defaultattr) {
			content = '<cite>' + attrs.defaultattr + ':</cite>' + content;
			addition = ' data-author="' + attrs.defaultattr + '"';
		}
		else {
			addition = ' class="uncited"'
		}

		return '<blockquote' + addition + '>' + content + '</blockquote>';
	},
	quoteType: function (val, name) {
		return '"' + val.replace('"', '\\"') + '"';
	},
	breakStart: false,
	breakEnd: false
});

sceditor.command.set('custombbcodes', {
	_dropDown: function (editor, caller, callback) {
		var content = document.createElement('div');

		sce_on(content, 'click', 'a', function (e) {
			callback($(this).data('bbcode'));
			editor.closeDropDown(true);
			e.preventDefault();
		});

		sceditor.utils.each(sceCustomBBcode, function (bbcode, label) {
			// parseHTML
			var tmp = document.createElement('div');
			tmp.innerHTML = '<a class="sceditor-fontsize-option" data-bbcode="' + bbcode + '" title="' + label + '" href="#">' + bbcode + '</a>';

			var	ret = document.createDocumentFragment();
			while (tmp.firstChild) {
				ret.appendChild(tmp.firstChild);
			}

			content.appendChild(ret);
		});

		editor.createDropDown(caller, 'custom-bbcodes-picker', content);
	},
	txtExec: function (caller) {
		var editor = this;

		sceditor.command.get('custombbcodes')._dropDown(
			editor,
			caller,
			function (bbcode) {
				editor.insertText(
					'[' + bbcode + ']',
					'[/' + bbcode + ']'
				);
			}
		);
	},
	exec: function (caller) {
		var editor = this;

		sceditor.command.get('custombbcodes')._dropDown(
			editor,
			caller,
			function (bbcode) {
				editor.insertText(
					'[' + bbcode + ']',
					'[/' + bbcode + ']'
				);
			}
		);
	},
	tooltip: 'Custom BBcodes'
});


// This is needed for the smilies popup
function setSmilie(tag) {
	sceditor.instance(textarea).insert(' ' + tag + ' ');
}

$(function () {
	sceController.init();

	// Don't need to select the node again and again
	textarea = sceController.getTextarea();
	// Hide the normal BBCode Buttons
	$('#format-buttons').hide();
	$('#smiley-box a img').each(function () {
		$(this).click(function () {
			setSmilie($(this).attr('alt'));
			return false;
		});
	});

	// Attachments
	var $fileList = $fileList || $('#file-list');
	// I use almost a 100% copy of the plupload JS code
	$fileList.on('click', '.file-inline-bbcode', function(e) {
		var attachId = $(this).parents('.attach-row').attr('data-attach-id'),
			index = phpbb.plupload.getIndex(attachId),
			textinsert = '[attachment=' + index + ']' + phpbb.plupload.data[index].real_filename + '[/attachment]';

		sceditor.instance(textarea).insert(textinsert);
	});
});