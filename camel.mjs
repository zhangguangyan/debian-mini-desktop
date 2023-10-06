// Function to convert a single snake_case string to camelCase
function toCamelCase(str) {
    return str.replace(/(_\w)/g, matches => matches[1].toUpperCase());
}

// Recursive function to traverse and update keys of an object
function convertKeysToCamelCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((accumulator, key) => {
            // Convert each key to camelCase
            const camelCaseKey = toCamelCase(key);
            // Recurse for nested objects/arrays
            accumulator[camelCaseKey] = convertKeysToCamelCase(obj[key]);
            return accumulator;
        }, {});
    }
    return obj;
}

// Example usage:
const snakeCaseObject = {
    snake_case_key: 1,
    another_key: {
        nested_key: 2,
        another_nested_key: [3, 4, { yet_another_key: 5 }]
    }
};

const camelCaseObject = convertKeysToCamelCase(snakeCaseObject);
console.log(camelCaseObject);
