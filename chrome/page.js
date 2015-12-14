var globalCredentialFields;

$(function() {
	var formFilter = "form";
	var inputFilter = "input[type='text'], input[type='email'], input[type='password'], input[type='tel'], input[type='number'], input:not([type])";
	var dialog = new QRCodeDialog();
	
	$(formFilter).each(function() {
		var formFields = {
			inputs: [],
			passwords: []
		};
		
		$(inputFilter, $(this)).each(function() {
			var field = $(this);
			if(field.is(":visible") && field.css("visibility") != "hidden" && field.css("visibility") != "collapsed") {
				if(field.attr("type") && field.attr("type").toLowerCase() == "password") {
					formFields.passwords.push(field);
				} else {
					formFields.inputs.push(field);
				}
			}
		});
		
		if (formFields.inputs.length > 0 && formFields.passwords.length > 0) {
			var icon = new CredentialIcon(formFields, dialog);
			icon.setPosition();
		}
	});	
	
	chrome.extension.onMessage.addListener(function(request, sender, callback) {
		if (request.action === "set_credential") {
			if (globalCredentialFields) {
				dialog.close();

				globalCredentialFields.inputs[0].val(request.message.headers["UserName"]);
				globalCredentialFields.passwords[0].val(request.message.headers["Password"]);
			}
		}
	});
});

var CredentialIcon = function(credentialFields, qrcodeDialog) {
	var iconDiv;
	
	(function() {
		var field = credentialFields.passwords[0];
		var $className = (field.outerHeight() > 28) ? "miqi-icon-key-big" : "miqi-icon-key-small";
		var $size = (field.outerHeight() > 28) ? 24 : 16;
		var $offset = Math.floor((field.outerHeight() - $size) / 3);
		$offset = ($offset < 0) ? 0 : $offset;
		var $zIndex = getZIndex(field);

		iconDiv = $("<div>").addClass("miqi-dialog-icon")
			.addClass($className)
			.css("z-index", $zIndex)
			.data("size", $size)
			.data("offset", $offset);

		iconDiv.click(function(e) {
			e.preventDefault();
			
			globalCredentialFields = credentialFields;
			qrcodeDialog.open(iconDiv);
		});
		
		$("body").append(iconDiv);
		
		function getZIndex(field) {
			var $zIndex = 0;
			var $zIndexField = field;
			var z;
			var c = 0;
			while($zIndexField.length > 0) {
				if(c > 100 || $zIndexField[0].nodeName == "#document") {
					break;
				}
				z = $zIndexField.css("z-index");
				if(!isNaN(z) && parseInt(z) > $zIndex) {
					$zIndex = parseInt(z);
				}
				$zIndexField = $zIndexField.parent();
				c++;
			}

			if(isNaN($zIndex) || $zIndex < 1) {
				$zIndex = 1;
			}
			
			$zIndex += 1;
			
			return $zIndex;
		}

	})();
	
	return {
		setPosition: function() {
			var field = credentialFields.passwords[0];
			iconDiv.css("top", field.offset().top + iconDiv.data("offset") + 1)
				.css("left", field.offset().left + field.outerWidth() - iconDiv.data("size") - iconDiv.data("offset"));
		},
	};
}

var QRCodeDialog = function() {
	var qrCode;
	var dialogDiv;
	var onSetCredential;
	var socket;
	
	(function() {
		dialogDiv = $("<div>");
		var temp = $("<div>");
		dialogDiv.append(temp);
		dialogDiv.hide();
		$("body").append(dialogDiv);
		
		qrCode = new QRCode(temp.get(0), {
			width : 250,
			height : 250
		});
		
		dialogDiv.dialog({
			closeText: "×",
			autoOpen: false,
			modal: true,
			resizable: false,
			minWidth: 280,
			title: "Fill in the form by scanning",
			open: function(event, ui) {
				chrome.extension.sendMessage({
					action: 'get_server_info',
				}, function(message) {
					if (message) {
						qrCode.makeCode(message);
					}
				});
				
				$(".ui-widget-overlay").click(function() {
					dialogDiv.dialog("close");
				});
			},
			close: function(event, ui) {
				chrome.extension.sendMessage({ action: 'close_connection' });
				qrCode.makeCode("");
			}
		});
	})();
	
	return {
		open: function(credentialIcon) {
			if(dialogDiv.dialog("isOpen")) {
				dialogDiv.dialog("close");
			} else {
				dialogDiv.dialog("option", "position", { 
					my: "left-10px top", 
					at: "center bottom", 
					of: credentialIcon 
				});
				dialogDiv.dialog("open");
			}
		},
		close: function() {
			dialogDiv.dialog("close");
		},
	};
};
