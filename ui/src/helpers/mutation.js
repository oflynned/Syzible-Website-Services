module.exports.lenite = (noun) => {
	const lenitableInitials = {
		"b": "bh", 
		"c": "ch", 
		"d": "dh", 
		"f": "fh", 
		"g": "gh", 
		"m": "mh", 
		"p": "ph", 
		"s": "ts", 
		"t": "th"
	};

	if(noun === null) return noun;
	let initial = noun.charAt(0).toLowerCase();
	return Object.keys(lenitableInitials).includes(initial) ? lenitableInitials[initial] + noun.slice(1) : noun;
};

module.exports.eclipse = (noun) => {
	const eclipsableInitials = {
		"a": "n-a",
		"á": "n-á",
		"b": "mb",
		"c": "gc",
		"d": "nd",
		"e": "n-e",
		"é": "n-é",
		"f": "bhf",
		"g": "ng",
		"i": "n-i",
		"í": "n-í",
		"o": "n-ó",
		"ó": "n-ó",
		"p": "bp",
		"t": "dt",
		"u": "n-u",
		"ú": "n-ú"
	};

	if(noun === null) return noun;
	let initial = noun.charAt(0).toLowerCase();
	return Object.keys(eclipsableInitials).includes(initial) ? eclipsableInitials[initial] + noun.slice(1) : noun;
};