/**
 * 
 {
    a: {
        "item[]": {
        }
    }
 }
 to {
    a: [{}]
 }
 * @param {*} originalObject 
 * @returns 
 */
function transformJSON(originalObject) {
    function transform(object) {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const value = object[key];
                // Check if we're dealing with an object or an array and recurse
                if (value && typeof value === 'object') {
                    object[key] = transform(value); // Recurse for objects or arrays
                }
            }
        }

        // After transforming all child properties, check if the current object has 'item[]'
        if (object.hasOwnProperty('item[]')) {
            // Replace the object with an array containing the 'item[]' value(s)
            const newArray = Array.isArray(object['item[]']) ? object['item[]'] : [object['item[]']];
            return newArray; // Return the new array to replace the object in the parent
        }

        return object;
    }

    // Start the transformation with the original object
    return transform(originalObject);
}

// Original JSON structure
const originalJSON = {
    "serviceResult": {
        "errorCategory": "string",
        "resultCode": "string",
        "objectResult": {
            "item[]": {
                "requestLine": "string",
                "xrefInfo": "string",
                "tabReturn": {
                    "item[]": {
                        "type": "string",
                        "id": "string",
                        "number": "string",
                        "message": "string",
                        "logNo": "string",
                        "LogMsgNo": "string",
                        "messageV1": "string",
                        "messageV2": "string",
                        "messageV3": "string",
                        "messageV4": "string",
                        "parameter": "string",
                        "row": "number",
                        "field": "string",
                        "system": "string"
                    }
                },
                "errorCategory": "string"
            }
        }
    }
};

// Perform the transformation
const transformedJSON = transformJSON(originalJSON);

// Log the transformed JSON to verify the results
console.log(JSON.stringify(transformedJSON, null, 2));


/*
{
    a: [{}]
}
to {
    a[]: {}
}
*/
function convertSingleValueArrays(obj) {
    // The function to recursively process each property
    function processNode(node) {
      if (Array.isArray(node)) {
        // If it's an array with a single value, return the value directly
        if (node.length === 1) {
          return processNode(node[0]);
        } else {
          // If it's an array with multiple values, process each value
          return node.map(processNode);
        }
      } else if (node !== null && typeof node === 'object') {
        // If it's an object, process each key-value pair
        const processedNode = {};
        for (const [key, value] of Object.entries(node)) {
          const newValue = processNode(value);
          if (Array.isArray(value) && value.length === 1) {
            // If the original value was a single-element array, append '[]' to the key
            processedNode[`${key}[]`] = newValue;
          } else {
            // Otherwise, use the original key
            processedNode[key] = newValue;
          }
        }
        return processedNode;
      }
      // If it's neither an array nor an object, return the value directly
      return node;
    }
  
    // Start processing from the root object
    return processNode(obj);
  }
  
  // Example usage with the provided JSON
  const originalJson = {
    "serviceResult": {
      "errorCategory": "string",
      "resultCode": "string",
      "objectResult": [
        {
          "requestLine": "string",
          "xrefInfo": "string",
          "tabReturn": [
            {
              "type": "string",
              "id": "string",
              "number": "string",
              "message": "string",
              "logNo": "string",
              "LogMsgNo": "string",
              "messageV1": "string",
              "messageV2": "string",
              "messageV3": "string",
              "messageV4": "string",
              "parameter": "string",
              "row": "number",
              "field": "string",
              "system": "string"
            }
          ],
          "errorCategory": "string"
        }
      ]
    }
  };
  
  const convertedJson = convertSingleValueArrays(originalJson);
  console.log(JSON.stringify(convertedJson, null, 2));
  
