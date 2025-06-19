function removeEmpty2(obj, isTopLevel = true) {
    if (Array.isArray(obj)) {
        // Filter out empty elements and recursively clean each element
        const filteredArray = obj
            .map(el => removeEmpty(el, false))
            .filter(el => el !== null && el !== undefined && (typeof el !== 'object' || Object.keys(el).length > 0));

        // Return empty array if it's the top-level array, otherwise null if the array is empty
        return filteredArray.length || isTopLevel ? filteredArray : null;
    } else if (typeof obj === 'object' && obj !== null) {
        // Clean each property recursively
        const cleanedObj = Object.keys(obj).reduce((acc, key) => {
            const cleanedValue = removeEmpty(obj[key], false);
            if (cleanedValue !== null && cleanedValue !== undefined && (typeof cleanedValue !== 'object' || Object.keys(cleanedValue).length > 0)) {
                acc[key] = cleanedValue;
            }
            return acc;
        }, {});

        return Object.keys(cleanedObj).length ? cleanedObj : null;
    }
    // Return non-object value as is
    return obj;
}

var safe = Regex.Replace(
    rawJson,
    @"(?<!\\)[\u0000-\u001F]",
    m => m.Value switch {
        "\n" => @"\n", "\r" => @"\r", "\t" => @"\t",
        _    => $@"\u{(int)m.Value[0]:x4}"
    });

