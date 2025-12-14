$ = jQuery; 

var MARGIN_LEFT = 0.35;
var MARGIN_TOP = 0.25;

var MAX_PAGE_BOTTOM = 11.0 - MARGIN_TOP / 2 ;
var MAX_PAGE_RIGHT = 8.5 - MARGIN_LEFT ;

var MAX_PAGE_A4_BOTTOM = 11.69 - MARGIN_TOP / 2 ;
var MAX_PAGE_A4_RIGHT = 8.27 - MARGIN_LEFT ;

var CARD_WIDTH = 2.49;
var CARD_HEIGHT = 3.49;
var CARD_BORDER = 0.120; //1/8 inch, minus a sliver

var spacingOptions = {
	horizontalSpacing: 0,
	verticalSpacing: 0,
	horizontalSpacingInches: 0,
	verticalSpacingInches: 0
};

var matchingCards = [];
var cardsForPdf = [];
var printedCards = [];

console.log("Vkit Verison 1.2");

function popuplateSpacingFields() {
	$("#inputHorizontalSpacing").val(spacingOptions.horizontalSpacing);
	$("#inputVerticalSpacing").val(spacingOptions.verticalSpacing);
	$("#inputBleed").val("0.125");
}

function getNewSpacingOptions() {
	// First, get the new spacing options (if they exist)
	var horizontalSpacing = document.getElementById("inputHorizontalSpacing").value;
	var verticalSpacing = document.getElementById("inputVerticalSpacing").value;

	var parsedHorizontal = parseInt(horizontalSpacing);
	var parsedVertical = parseInt(verticalSpacing);

	if (isNaN(parsedHorizontal) || isNaN(parsedVertical)) {
		alert("The spacing fields contains a invalid value. Please make sure to use whole numbers (0, 1, 2, etc)");
		return false;
	}

	spacingOptions.horizontalSpacing = parsedHorizontal;
	spacingOptions.verticalSpacing = parsedVertical;
	spacingOptions.horizontalSpacingInches = parsedHorizontal / 200;
	spacingOptions.verticalSpacingInches = parsedVertical / 200;

	return true;
}

function showPrintProgress() {
	$('#printProgressObj').css('display', 'block');
}

function hidePrintProgress() {
	$('#printProgressObj').css('display', 'none');
}

function expandCollapseSpacingOptions() {
	var displayMode = $('#printOptionsObj').css('display');
	if (displayMode == "none") {
			$('#printOptionsObj').css('display', 'block');
	} else {
			$('#printOptionsObj').css('display', 'none');
	}
}

function expandCollapseInstructions() {
		var displayMode = $('#instructionsObj').css('display');
		if (displayMode == "none") {
				$('#instructionsObj').css('display', 'block');
		} else {
				$('#instructionsObj').css('display', 'none');
		}
}

function getFilterText() {
	var textObj = $('#filterText');
	return textObj.val();
}

function updateMatchingCards() {
	var i = 0;

	var filterText = getFilterText();
	console.log("Filter Change!: " + filterText);


	matchingCards.length = 0;
	var cardNames = Object.keys(allCardNames).sort();
	for (i = 0; i < cardNames.length; i++) {
		var matches = false;

		var lowercaseFilterText = filterText.toLowerCase();

		if ("" === lowercaseFilterText) {
			matches = true;
		} else if (-1 != cardNames[i].toLowerCase().indexOf(lowercaseFilterText)) {
			matches = true;
		}

		if (matches) {
			matchingCards.push(cardNames[i]);
		}
	}

		$('#selectAdds').find('option').remove();

		for (i = 0; i < matchingCards.length; i++) {
			var match = matchingCards[i];
			console.log("Add card: " + match);
			$('#selectAdds').append('<option value="' + match + '">' + match + '</option>');
		}

		// Automatically select the first card in the search results
		if (matchingCards.length > 0) {
			$('#selectAdds > option:eq(0)').prop('selected', true)
		}
		
		$("#selectAdds option").dblclick(function() {
			addSelectedCards(false);
		});

}

function queueFilterChange() {
	setTimeout(filterChanged, 250);
}

function filterChanged() {
	updateMatchingCards();
}

function addSelectedCards(isWhiteBorder) {

	// Try to add the cards next to it's duplicates (if exist)
	$("#selectAdds").find(":selected").each(function() {
		var cardToAdd = $(this).val();

		var inserted = false;
		for (var j = 0; j < cardsForPdf.length; j++) {
			if (cardsForPdf[j] == cardToAdd) {
				cardsForPdf.splice(j, 0, cardToAdd);
				inserted = true;
				break;
			}
		}

		if (!inserted) {
			cardsForPdf.push(cardToAdd);
		}

		redrawSelectedCards();

		// Selected the last card that we added
		var indexToSelect = j;
		if (!inserted) {
			indexToSelect = cardsForPdf.length - 1;
		}
		$('#selectedRemoves > option').eq(indexToSelect).prop('selected', true);
		
		$("#selectedRemoves option").dblclick(function() {
			removeSelectedCards();
		});
			
	});

}

function redrawSelectedCards() {
	$('#selectedRemoves').find('option').remove();

	for (var i = 0; i < cardsForPdf.length; i++) {
		var match = cardsForPdf[i];
		console.log("Add card: " + match);
		$('#selectedRemoves').append('<option value="' + match + '">' + match + '</option>');
	}
}

function removeSelectedCards() {
	$("#selectedRemoves").find(":selected").each(function() {
		var cardToRemove = $(this).val();
		for (var j = 0; j < cardsForPdf.length; j++) {
			if (cardsForPdf[j] == cardToRemove) {
				$(this).remove();
				cardsForPdf.splice(j, 1);
				break;
			}
		}
	});
}

var TO_RADIANS = Math.PI/180; 

function convertImgToBase64(isWhiteBorder, url, canvas, img, callback) {

	img.crossOrigin = "Anonymous";
	img.src = url;
	img.onload = function() {
		canvas.height = img.height;
		canvas.width = img.width;
		var context = canvas.getContext('2d');
		
		var aspectRatio = canvas.height / canvas.width;
		if(aspectRatio < 1) //card is horizontal
		{
			canvas.width = img.height;
			canvas.height = img.width;
			context = canvas.getContext('2d');
			context.translate(0, canvas.height); 
			context.rotate(-90 * TO_RADIANS);
			context.drawImage(img, 0, 0);
			aspectRatio = canvas.height / canvas.width;
		}
		else
		{
			context.drawImage(img, 0, 0);
		}

		if (isWhiteBorder) {
				convertCanvasToWhiteBorder2(canvas);
		}

		var dataURL = canvas.toDataURL('image/png');
		
		callback(dataURL, aspectRatio);
	};
	img.onerror = function() {
			console.log("Failed ot open image: " + url);
			callback(null);
	};

}

function convertBleedImgToBase64(margin, url, canvas, img, callback) {

	img.crossOrigin = "Anonymous";
	img.src = url;
	img.onload = function() {
		canvas.height = img.height;
		canvas.width = img.width;
		var context = canvas.getContext('2d');
		var horiz = false;
		
		var aspectRatio = canvas.height / canvas.width;
		if(aspectRatio < 1) //card is horizontal
		{
			canvas.width = img.height;
			canvas.height = img.width;
			context = canvas.getContext('2d');
			horiz = true;
			//context.translate(0, canvas.height); 
			aspectRatio = canvas.height / canvas.width;
		}
		
		var dpi = canvas.height / CARD_HEIGHT;
		var halfMargin = dpi * margin;
		var border = dpi * CARD_BORDER;
		canvas.height += halfMargin * 2;
		canvas.width += halfMargin * 2;
		context.translate(halfMargin, halfMargin);
		
		context.fillStyle = "rgba(0, 0, 0, 255)";
		//fill background
		context.fillRect(-halfMargin, -halfMargin, canvas.width, canvas.height);
		//draw card
		if(horiz) {
			context.resetTransform();
			context.translate(halfMargin, canvas.height - halfMargin);
			context.rotate(-90 * TO_RADIANS);
			context.drawImage(img, 0, 0);
			context.resetTransform();
		}
		else {
			context.drawImage(img, 0, 0);
			context.translate(-halfMargin, -halfMargin);
		}
		
		//top edge
		context.fillRect(0, 0, canvas.width, halfMargin + border);
		//bottom edge
		context.fillRect(0, canvas.height - halfMargin - border, canvas.width, halfMargin + border);
		//left edge
		context.fillRect(0, 0, halfMargin + border, canvas.height);
		//right edge
		context.fillRect(canvas.width - halfMargin - border, 0, halfMargin + border, canvas.height);

		var dataURL = canvas.toDataURL('image/png');
		
		callback(dataURL, aspectRatio);
	};
	img.onerror = function() {
			console.log("Failed to open image: " + url);
			callback(null);
	};

}

function setPrintPoint(pointObj, top, left, bottom, right) {
	pointObj.top = top;
	pointObj.left = left;
	pointObj.bottom = bottom;
	pointObj.right = right;
}

//			images.file("smile.gif", imgData, {base64: true});

function zipCards(folder, cardsToPrint) {

	for (var i = 0; i < cardsToPrint.length; i++) {
		var card = cardsToPrint[i];

		var name = stripTitleToBasics(card.name) + ".png";
		folder.file(name, card.dataUrl.split('base64,')[1], {base64: true});

	}

}


function printCards(doc, cardsToPrint, lastPrintPoint, pageRight, pageBottom) {

	for (var i = 0; i < cardsToPrint.length; i++) {
		var card = cardsToPrint[i];

		var calculatedHeight = CARD_WIDTH * card.aspectRatio;
		//console.log("calculatedHeight: " + calculatedHeight);

		var nextTop = lastPrintPoint.top;
		var nextLeft = lastPrintPoint.right;
		var addedPageOrRow = false;

		// If this card exceeds the bottom, add a new page
		if ((nextTop + calculatedHeight) > pageBottom) {
			// Won't fit on page!	Add a new page!
			//console.log("Next bottom would have been off-page. Figuring out to adapt!");
			doc.addPage();
			addedPageOrRow = true;
			nextTop = MARGIN_TOP;
			nextLeft = MARGIN_LEFT;
			//setPrintPoint(lastPrintPoint, MARGIN_TOP, MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT);
		}

		// If this card will exceed the width, add a new row OR a new page if needed
		if ((nextLeft + CARD_WIDTH) > pageRight) {
			//console.log("Next right edge would have been off screen. Figuring out how to adapt!");
			nextTop = lastPrintPoint.bottom;
			nextTop += spacingOptions.verticalSpacingInches;

			// Need to add a new row
			if ((nextTop + calculatedHeight) < pageBottom) {
				// Card will fit in the page in the next rows
				//console.log("Adding new row!");
				nextTop = lastPrintPoint.bottom;
				nextTop += spacingOptions.verticalSpacingInches;
				nextLeft = MARGIN_LEFT;
				addedPageOrRow = true;
			} else {
				// Need a whole new page
				//console.log("Adding new page!");
				doc.addPage();
				nextTop = MARGIN_TOP;
				nextLeft = MARGIN_LEFT;
				addedPageOrRow = true;
			}
		} else {
			// Card will fit in this row on this page!	No adjustments needed.
		}

		if (card.dataUrl !== null) {
			doc.addImage(card.dataUrl, 'jpeg', nextLeft, nextTop, CARD_WIDTH, calculatedHeight);
		}

		// 'bottom' of last card can't be any higher than the lowest card in the current row
		var bottomOfLastPrintedCard = nextTop + calculatedHeight;
		if (!addedPageOrRow) {
			bottomOfLastPrintedCard = Math.max(bottomOfLastPrintedCard, lastPrintPoint.bottom);
		}
		// Adjust the print-point based on the card we just added
		setPrintPoint(lastPrintPoint, nextTop, nextLeft,
					bottomOfLastPrintedCard, nextLeft + CARD_WIDTH + spacingOptions.horizontalSpacingInches);

	}

}

function generate() {
	var outputFormat = $('input[name=output]:checked', '#outputForm').val();
	
	if(outputFormat === "pdf-letter") {
		generatePdf("letter");
	}
	else if (outputFormat === "pdf-a4") {
		generatePdf("a4");
	}
	else if (outputFormat === "bleed") {
		generateZippedPNG();
	}
}

function generateZippedPNG() {
	console.log("Generating bleed PNG...");
	
	var canvas = document.createElement('canvas');
	var img = document.createElement('img');
	var margin = Number($("#inputBleed").val());

	showPrintProgress();
	
	var cardsWithSizes = [];
	
	function addNextCard(currentCardIndex) {

		var progressElement = document.getElementById("progressText");
		if (progressElement) {
			progressElement.innerHTML = "Adding card: " + currentCardIndex + " of " + cardsForPdf.length;
		}

		if (currentCardIndex == cardsForPdf.length) {
				
			if (progressElement) {
					progressElement.innerHTML = "Finalizing ZIP...";
			}

			var zip = new JSZip();
			var images = zip.folder("images");

			zipCards(images, cardsWithSizes);

			zip.generateAsync({type:"blob"}).then(function(content) {
					// see FileSaver.js
					saveAs(content, "vktPng.zip");
			});

			hidePrintProgress();

			img = null;
			canvas = null;

		} else {

			var size = $('input[name=size]:checked', '#sizeForm').val();
			var cardName = cardsForPdf[currentCardIndex];
			var cardPath = allCardNames[cardName][size];
			console.log("image: " + cardPath );

			// Async function to keep adding new cards until finished
			convertBleedImgToBase64(margin, cardPath, canvas, img, function(dataUrl, aspectRatio) {

				cardsWithSizes.push( {
					name: cardName,
					cardPath: cardPath,
					dataUrl: dataUrl,
					aspectRatio: aspectRatio
				});

				addNextCard(currentCardIndex+1);
			});
		}
	}

	addNextCard(0);
}

function generatePdf(size) {
		console.log("Generating PDF...");
		if (!getNewSpacingOptions()) {
			return;
		}

		var canvas = document.createElement('canvas');
		var img = document.createElement('img');

		showPrintProgress();

		console.log("Spacing options are at: " + spacingOptions.horizontalSpacingInches	+ " V: " + spacingOptions.verticalSpacingInches);

		var doc = null;
		
		if(size == "letter") {
			doc = new jspdf.jsPDF('portrait', 'in', [11, 8.5]);
		}
		else {
			//A4
			//doc = new jspdf.jsPDF('portrait', 'mm', [297, 210]);
			doc = new jspdf.jsPDF('portrait', 'in', [11.69, 8.27]);
		}
		

		var cardsWithSizes = [];

		function addNextCard(currentCardIndex) {

			var progressElement = document.getElementById("progressText");
			if (progressElement) {
				progressElement.innerHTML = "Adding card: " + (currentCardIndex + 1) + " of " + cardsForPdf.length;
			}

			if (currentCardIndex == cardsForPdf.length) {
				
				if (progressElement) {
					progressElement.innerHTML = "Finalizing PDF...";
				}

				var lastPrintPoint = {};
				var pageBottom = 0;
				var pageRight = 0;
				
				if(size == "letter") {
					lastPrintPoint = {
						left: MARGIN_LEFT,
						top: MARGIN_TOP,
						right: MARGIN_LEFT,
						bottom: MARGIN_TOP
					};
					pageBottom = MAX_PAGE_BOTTOM;
					pageRight = MAX_PAGE_RIGHT;
				}
				else {
					//A4
					lastPrintPoint = {
						left: MARGIN_LEFT,
						top: MARGIN_TOP,
						right: MARGIN_LEFT,
						bottom: MARGIN_TOP
					};
					pageBottom = MAX_PAGE_A4_BOTTOM;
					pageRight = MAX_PAGE_A4_RIGHT;
				}
				
				printCards(doc, cardsWithSizes, lastPrintPoint, pageRight, pageBottom);

				doc.output('save', 'vkitPdf.pdf');

				hidePrintProgress();

				img = null;
				canvas = null;

			} else {

				var size = $('input[name=size]:checked', '#sizeForm').val();
				var cardName = cardsForPdf[currentCardIndex];
				var cardPath = allCardNames[cardName][size];
				console.log("image: " + cardPath );

				// Async function to keep adding new cards until finished
				convertImgToBase64(isWhiteBorder, cardPath, canvas, img, function(dataUrl, aspectRatio) {
					cardsWithSizes.push( {
						name: cardName,
						cardPath: cardPath,
						dataUrl: dataUrl,
						aspectRatio: aspectRatio
					});

					addNextCard(currentCardIndex+1);
				});
			}
		}

		addNextCard(0);
}

setTimeout(setupKeyListener, 1000);

function moveSelectionDown() {
	// User hit the down arrow while in the input box. 
	// Just shift focus to the "selected cards" field so the user can navigate
	$('#selectAdds').focus()
}

function setupKeyListener() {

	$($("#filterText").get()).keydown(function(evt){
		if (evt.which === 40) {
			// Down Key
			moveSelectionDown();
		}
	});

	$($("body").get()).keydown(function(evt){
		if (evt.which === 13) {
			// Enter key pressed. Add the selected card
			addSelectedCards(false);
		}
	});

	$($("#selectedRemoves").get()).keydown(function(evt){
		if (evt.keyCode === 46 || evt.keyCode === 8) {
			// Delete Key
			removeSelectedCards();
		}
	});

}


/*
 * File Uploading
 */
function loadEventFromFile() {
	var input, file, fr;

	if (typeof window.FileReader !== 'function') {
		alert("The file API isn't supported on this browser yet.");
		return;
	}

	input = $('#fileinput').get(0);
	input.onchange = function() {
		if (!input) {
			alert("Um, couldn't find the fileinput element.");
		}
		else if (!input.files) {
			alert("This browser doesn't seem to support the `files` property of file inputs.");
		}
		else if (!input.files[0]) {
			alert("Please select a file before clicking 'Load'");
		}
		else {
			file = input.files[0];
			fr = new FileReader();
			fr.onload = receivedText;
			fr.readAsText(file);
		}

		function receivedText(e) {
			var lines = e.target.result;
			loadCards(lines);
			input.onchange = function() {};
			$(input).val(null);
		}
	}
	input.click();
}

function loadCards(fileContents) {
	if (fileContents.indexOf("<?xml ") != -1) {
		loadCardFromGempExport(fileContents);
	} else {
		alert("Gemp plaintext lists not supported yet. Please use GEMP Deck Export files for now")
	}
}

function loadCardFromGempExport(fileContents) {

	var includeShields = confirm("Include shields and other cards from outside of deck?");

	// Kill all lines which start with "<cardOutsideDeck"
	if (!includeShields) {
		fileContents = fileContents.replace(/cardOutsideDeck.*>/g, '');
	}

	const regexp = /title="([a-zA-Z 0-9,.:'&\\\/\"\-]*)"/g;

	const matches = [...fileContents.matchAll(regexp)];
	const cardNames = matches.map(match => match[1]);

	addCardsByNames(cardNames);
}

function addCardsByNames(cardNames) {

	const strippedCardNames = cardNames.map(cardName => cardName.replace(/[^a-zA-Z0-9]/g, ''));
	var strippedActualCards = allCardNames.map(actualCard => actualCard.name.replace(/[^a-zA-Z0-9]/g, ''));

	// Try to find all the stripped cards in the list of normal cards
	strippedCardNames.forEach(card => {

		var bestMatchIndex = -1;
		var bestMatchSimilarity = 0.5;

		for (var i = 0; i < strippedActualCards.length; i++) {
			var matchPercent = similarity(card, strippedActualCards[i]);
			if (matchPercent > bestMatchSimilarity) {
				bestMatchIndex = i;
				bestMatchSimilarity = matchPercent;
			}
		}

		if (bestMatchIndex != -1 && bestMatchSimilarity > 0.8) {
			cardsForPdf.push(allCardNames[bestMatchIndex]);
		}

	});

	redrawSelectedCards();
}

function stripTitleToBasics(cardName) {
	var strippedName = cardName
		.replace(/ - /g,"-")
		.replace(/\s/g, "_")
		.replace(/[^a-zA-Z0-9_-]/g, '');
	return strippedName;
}


/*
 *	Calculation of Levenshtein Distance:
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 */

function similarity(s1, s2) {
	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength == 0) {
		return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();

	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0)
				costs[j] = j;
			else {
				if (j > 0) {
					var newValue = costs[j - 1];
					if (s1.charAt(i - 1) != s2.charAt(j - 1))
						newValue = Math.min(Math.min(newValue, lastValue),
							costs[j]) + 1;
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
		}
		if (i > 0)
			costs[s2.length] = lastValue;
	}
	return costs[s2.length];
}


// ============================================
// GEMP DECK IMPORT FUNCTIONALITY
// ============================================

/**
 * Main entry point for importing a Gemp deck
 */
async function importGempDeck() {
    const urlInput = document.getElementById('gempDeckUrl');
    const statusSpan = document.getElementById('importStatus');
    const url = urlInput.value.trim();
    
    if (!url) {
        statusSpan.textContent = 'Please enter a Gemp deck URL';
        statusSpan.style.color = 'red';
        return;
    }
    
    // Validate it looks like a Gemp share URL
    if (!url.includes('lotrtcgpc.net/share/deck') && !url.includes('lotrtcgpc.net/gemp-lotr-server/deck/html')
        && !url.includes('lotrtcgpc.net/gemp-lotr-server/deck/libraryHtml')) {
        statusSpan.textContent = 'URL does not appear to be a Gemp deck share link';
        statusSpan.style.color = 'red';
        return;
    }
    
    statusSpan.textContent = 'Fetching deck...';
    statusSpan.style.color = 'black';
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch deck: ${response.status}`);
        }
        
        const html = await response.text();
        const cards = parseGempDeckHtml(html);
        
        if (cards.length === 0) {
            statusSpan.textContent = 'No cards found in deck';
            statusSpan.style.color = 'red';
            return;
        }
        
        const result = addCardsToSelection(cards);
        
        statusSpan.textContent = `Imported ${result.added} cards (${result.notFound} not found)`;
        statusSpan.style.color = result.notFound > 0 ? 'orange' : 'green';
        
        if (result.missingCards.length > 0) {
            console.warn('Cards not found in VKIT:', result.missingCards);
        }
        
    } catch (error) {
        console.error('Error importing deck:', error);
        statusSpan.textContent = `Error: ${error.message}`;
        statusSpan.style.color = 'red';
    }
}

/**
 * Parse the Gemp deck HTML and extract card information
 * @param {string} html - Raw HTML from Gemp share endpoint
 * @returns {Array} Array of {count, imageUrl, name} objects
 */
function parseGempDeckHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = [];
    
    // Find all tooltip spans (each card entry)
    const tooltips = doc.querySelectorAll('span.tooltip');
    
    tooltips.forEach(tooltip => {
        const img = tooltip.querySelector('img.ttimage');
        if (!img) return;
        
        const imageUrl = img.getAttribute('src');
        const cardName = tooltip.childNodes[0]?.textContent?.trim();
        
        // Check for count prefix (e.g., "2x " before the tooltip)
        let count = 1;
        const previousText = tooltip.previousSibling?.textContent || '';
        const countMatch = previousText.match(/(\d+)x\s*$/);
        if (countMatch) {
            count = parseInt(countMatch[1], 10);
        }
        
        if (imageUrl && cardName) {
            cards.push({ count, imageUrl, name: cardName });
        }
    });
    
    return cards;
}

/**
 * Parse a Gemp/wiki image URL to extract set and card number
 * @param {string} url - Image URL like "https://wiki.lotrtcgpc.net/images/LOTR-EN01S290.0_card.jpg"
 * @returns {Object|null} {set, cardNum, isErrata} or null if parsing fails
 */
function parseGempImageUrl(url) {
    // Extract just the filename
    const filename = url.split('/').pop();
    
    // Match patterns like:
    // LOTR-EN01S290.0_card.jpg (standard)
    // LOTR-ENV3S055.0_card.jpg (V-set)
    // LOTR-EN03E106.1_card.jpg (errata)
    const match = filename.match(/LOTR-EN(V?\d+)([A-Z])(\d+)\.(\d+)/);
    
    if (!match) {
        console.warn('Could not parse image URL:', url);
        return null;
    }
    
    const rawSet = match[1];    // "01", "V3", "03"
    const variant = match[2];   // "S", "E", etc.
    const cardNum = match[3];   // "290", "055", "106"
    const revision = match[4];  // "0", "1"
    
    // Determine if this is an errata version
    const isErrata = variant === 'E' || parseInt(revision, 10) > 0;
    
    // Normalize set format to match VKIT keys
    // Gemp V-sets: "V3" stays as "V3"
    // Regular sets: "01" stays as "01"
    let set = rawSet;
    
    // Pad card number to 3 digits if needed (VKIT uses "055" not "55")
    const paddedCardNum = cardNum.padStart(3, '0');
    
    return { set, cardNum: paddedCardNum, isErrata };
}

/**
 * Build the VKIT key prefix from parsed card info
 * @param {Object} parsed - {set, cardNum, isErrata}
 * @returns {string} Prefix like "01_290" or "V3_055"
 */
function buildVkitKeyPrefix(parsed) {
    // VKIT keys look like "01_290 - Frodo, Son of Drogo"
    // or "V3_055 - Raiding Schooner"
    return `${parsed.set}_${parsed.cardNum}`;
}

/**
 * Find a VKIT card key that matches the parsed Gemp card
 * @param {Object} parsed - {set, cardNum, isErrata}
 * @param {string} cardName - Card name from Gemp (for fallback matching)
 * @returns {string|null} VKIT card key or null if not found
 */
function findVkitCardKey(parsed, cardName) {
    if (!parsed) return null;
    
    const prefix = buildVkitKeyPrefix(parsed);
    const allCardKeys = Object.keys(allCardNames);
    
    // Find all keys that start with this prefix
    const matches = allCardKeys.filter(key => key.startsWith(prefix + ' - '));
    
    if (matches.length === 0) {
        // Try without zero-padding
        const altPrefix = `${parsed.set}_${parseInt(parsed.cardNum, 10)}`;
        const altMatches = allCardKeys.filter(key => key.startsWith(altPrefix + ' - '));
        if (altMatches.length > 0) {
            return selectBestMatch(altMatches, parsed.isErrata);
        }
        return null;
    }
    
    return selectBestMatch(matches, parsed.isErrata);
}

/**
 * Select the best matching VKIT key based on errata status
 * @param {Array} matches - Array of matching VKIT keys
 * @param {boolean} isErrata - Whether we're looking for an errata version
 * @returns {string} Best matching key
 */
function selectBestMatch(matches, isErrata) {
    if (matches.length === 1) {
        return matches[0];
    }
    
    // Prefer errata version if isErrata, otherwise prefer non-errata
    const errataMatch = matches.find(k => k.includes('(Errata)'));
    const standardMatch = matches.find(k => !k.includes('(Errata)'));
    
    if (isErrata && errataMatch) {
        return errataMatch;
    }
    if (!isErrata && standardMatch) {
        return standardMatch;
    }
    
    // Fallback to first match
    return matches[0];
}

/**
 * Add parsed cards to VKIT's selection list
 * @param {Array} cards - Array of {count, imageUrl, name} objects
 * @returns {Object} {added, notFound, missingCards}
 */
function addCardsToSelection(cards) {
    let added = 0;
    let notFound = 0;
    const missingCards = [];
    
    cards.forEach(card => {
        const parsed = parseGempImageUrl(card.imageUrl);
        const vkitKey = findVkitCardKey(parsed, card.name);
        
        if (vkitKey && allCardNames[vkitKey]) {
            // Add the card (count) times to the cardsForPdf array
            for (let i = 0; i < card.count; i++) {
                cardsForPdf.push(vkitKey);
                added++;
            }
        } else {
            notFound += card.count;
            missingCards.push(`${card.name} (${card.imageUrl})`);
        }
    });
    
    // Rebuild the selection list from cardsForPdf
    redrawSelectedCards();
    
    // Re-attach double-click handler
    $("#selectedRemoves option").dblclick(function() {
        removeSelectedCards();
    });
    
    return { added, notFound, missingCards };
}

function clearSelection() {
    cardsForPdf.length = 0;
    redrawSelectedCards();
}


var allCardNames	= [];
var isWhiteBorder = false;
var size = "original";

$(document).ready(function() {
	
	// Clear the import URL field on load
    $('#gempDeckUrl').val('');
	
	$('input[type=radio][name=output]').change(function() {
		if (this.value == 'pdf') {
			$("#spacingForm").show()
			$("#bleedForm").hide()
		}
		else if (this.value == 'bleed') {
			$("#spacingForm").hide()
			$("#bleedForm").show()
		}
	});
	
	
	jQuery('.numbersOnly').on("input", function () { 
		this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
	});

	console.log("After Loaded");

		$.getJSON('allCards.json', function(data) {
				allCardNames	= data.allCards;
				//console.log("allCardNames:", JSON.stringify(allCardNames));
				popuplateSpacingFields();
				updateMatchingCards();
		}); 

});
