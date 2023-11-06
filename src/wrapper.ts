import {Lexer} from "./lexer";
import {Parser} from "./parser";
import type {ASTNode, AttributeNode, BlockNode, DictionaryNode, LiteralNode} from "./ast";
import {NodeType} from "./ast";
import type {Token} from "./token";

/**
 * Returns an array of proxies that wrap the AST Nodes parsed from the OCL file. The proxy allows
 * regular property access to the OCL properties, allowing the returned objects to be treated like
 * regular JavaScript objects.
 * @param input The OCL to parse
 */
export function parseSteps(input: string) {
    const lexer = new Lexer(input)
    const parser = new Parser(lexer)
    const ast = parser.getAST()
    return ast.map(step => new Proxy(step, {
        get: function (target, name) {
            return getProperty(target, name.toString())
        }
    })) as any
}

function getProperty(node: ASTNode | undefined, name: string): string|number|boolean|BlockNode|DictionaryNode|undefined {
    if (!node || !name) {
        return undefined
    }

    if (node.type === NodeType.BLOCK_NODE) {
        // find an attribute node with the name and return the raw value
        const attributeChild = node.children
            ?.filter(c =>
                c.type === NodeType.ATTRIBUTE_NODE &&
                c.name.value === name)
            .map(c => getUnquotedPropertyValue(c as AttributeNode))
            .pop()

        // find a block node with the name and wrap it up in a proxy
        const blockChild: BlockNode | undefined = node.children
            ?.filter(c =>
                c.type === NodeType.BLOCK_NODE &&
                c.name.value === name)
            .map(c => new Proxy(c as BlockNode, {
                get: function (target, name) {
                    return getProperty(target, name.toString())
                }
            }))
            .pop()

        return attributeChild ?? blockChild
    }

    return undefined
}

function getUnquotedPropertyValue(node: AttributeNode | undefined): string|number|boolean|DictionaryNode|undefined {
    if (!node || node.type !== NodeType.ATTRIBUTE_NODE) {
        return undefined
    }

    if (node.value.type == NodeType.LITERAL_NODE) {
        const attValueNode = node.value as LiteralNode
        const litValueNode = attValueNode.value as Token
        const value = litValueNode.value
        return JSON.parse(value)
    }

    if (node.value.type === NodeType.DICTIONARY_NODE) {
        return new Proxy(node.value, {
            get: function (target, name) {
                return getProperty(target, name.toString())
            }
        })
    }

    return undefined
}