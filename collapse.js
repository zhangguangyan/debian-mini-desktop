function removeEmpty(obj) {
    if (Array.isArray(obj)) {
        // Filter out empty elements and recursively clean each element
        const filteredArray = obj
            .map(removeEmpty)
            .filter(el => el !== null && el !== undefined && (typeof el !== 'object' || Object.keys(el).length > 0));

        return filteredArray.length ? filteredArray : null;
    } else if (typeof obj === 'object' && obj !== null) {
        // Clean each property recursively
        const cleanedObj = Object.keys(obj).reduce((acc, key) => {
            const cleanedValue = removeEmpty(obj[key]);
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