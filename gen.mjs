import ts from "typescript";

const json = {
    "Name": "string",
    "Item": [{
        "code": "string",
        "nested1": [{
            "p1": "string",
            "p2": "string",
            "nested2": [{
                "p1": "string",
                "p2": "string",
            }]
        }]
    }]
};

function translate(json) {
    return Object.keys(json).map((key) => {
        if (Array.isArray(json[key])) {
            const subType = json[key][0];
            const subMembers = translate(subType);  // Recursion to handle nested structures
            const typeLiteralNode = ts.factory.createTypeLiteralNode(subMembers);
            return ts.factory.createPropertySignature(
                undefined,
                key,
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                ts.factory.createArrayTypeNode(typeLiteralNode)
            );
        } else if (typeof json[key] === 'object') {
            const subType = json[key];
            const subMembers = translate(subType);  // Recursion to handle nested structures
            const typeLiteralNode = ts.factory.createTypeLiteralNode(subMembers);
            return ts.factory.createPropertySignature(
                undefined,
                key,
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                typeLiteralNode
            );
        } else {
            return ts.factory.createPropertySignature(
                undefined,
                key,
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
            );
        }
    });
}

function createTypeDeclaration(typeNmae, members) {
    return ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        typeNmae,
        undefined,
        ts.factory.createTypeLiteralNode(members)
    );
}

function generateTypeScript(json) {
    const members = translate(json);

    const typeNode1 = createTypeDeclaration("MyType1", members);

    const resultFile = ts.createSourceFile(
        "dummy.ts",
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );

    const updatedResultFile = ts.factory.updateSourceFile(resultFile, [typeNode1]);

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    return printer.printFile(updatedResultFile);
}

console.log(generateTypeScript(json));
