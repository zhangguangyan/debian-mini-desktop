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



using System;
using System.Text;

public static class JsonSanitizer
{
    // Escapes raw control codes; returns the original string if none found.
    public static string EscapeControlChars(string input)
    {
        ReadOnlySpan<char> src = input;
        int idx = src.IndexOfAnyInRange('\u0000', '\u001F');    // .NET 8 API
        if (idx == -1) return input;                            // fast-path

        var sb = new StringBuilder(src.Length + 8);
        sb.Append(src[..idx]);                                  // copy safe prefix
        for (int i = idx; i < src.Length; i++)
        {
            char c = src[i];
            if (c <= 0x1F)                                      // illegal
            {
                sb.Append(c switch
                {
                    '\n' => "\\n",
                    '\r' => "\\r",
                    '\t' => "\\t",
                    _     => $"\\u{(int)c:x4}"
                });
            }
            else sb.Append(c);
        }
        return sb.ToString();
    }
}


