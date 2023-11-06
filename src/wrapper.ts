import {Lexer} from "./lexer";
import {Parser} from "./parser";
import type {AST, ASTNode, AttributeNode, BlockNode, DictionaryNode, LiteralNode} from "./ast";
import {NodeType} from "./ast";
import type {Token} from "./token";

/**
 * Returns an array of proxies that wrap the AST Nodes parsed from the OCL file. The proxy allows
 * regular property access to the OCL properties, allowing the returned objects to be treated like
 * regular JavaScript objects.
 * @param input The OCL to parse
 */
export function parseOclWrapper(input: string): any {
    const lexer = new Lexer(input)
    const parser = new Parser(lexer)
    const ast = parser.getAST()

    /*
        The top level object is treated as a "root node" rather than a plain array. It responds to
        any requests to an index or properties like length, but also allows blocks and attributes to
        be returned by name.
     */
    return new Proxy(ast, {
            get: function (target, name): any {
                // return any array based properties as normal
                if (name in target) {
                    return wrapItem(target[name as any]);
                }

                const attributes = wrapChildAttributes(target, name.toString())
                if (attributes != undefined) {
                    return attributes
                }

                return wrapChildArray(target, name.toString())
            },
            set: function () {
                // no op - this is a read only object
                return true
            }
        }
    )
}

function getProperty(node: ASTNode | undefined, name: string): any {
    if (!node || !name) {
        return undefined
    }

    // __labels and __name are special property that returns the labels assigned to the block
    // and tyhe name of the block
    if (node.type === NodeType.BLOCK_NODE) {
        if (name === "__labels") {
            return node.labels?.map(l => JSON.parse(l.value.value))
        }
    }

    if (node.type === NodeType.BLOCK_NODE || node.type == NodeType.ATTRIBUTE_NODE) {
        if (name === "__name") {
            return node.name.value
        }
    }

    // Otherwise we try to find the children with the supplied name
    if (node.type === NodeType.BLOCK_NODE || node.type == NodeType.DICTIONARY_NODE) {
        // find attribute nodes with the name and return the raw value
        const attributes = wrapChildAttributes(node.children, name)
        if (attributes != undefined) {
            return attributes
        }

        // find block nodes with the name and wrap it up in a proxy
        const blockChildren: BlockNode[] | undefined = node.children
            ?.filter(c =>
                c.type === NodeType.BLOCK_NODE &&
                c.name.value === name)
            .map(c => c as BlockNode)

        if (blockChildren && blockChildren.length != 0) {
            // An array of block children is distinguished by their first label, which is
            // selected as if it were a property.
            return new Proxy(blockChildren, {
                set: function () {
                    // no op - this is a read only object
                    return true
                },
                get: function (target, name) {

                    // return any array based properties as normal
                    if (name in target) {
                        return wrapItem(target[name as any]);
                    }

                    // Otherwise, look up the child based on a label
                    const children = target.filter(b => b.labels
                        ?.map(l => JSON.parse(l.value.value))
                        .pop() === name)

                    if (children) {
                        if (children.length === 1) {
                            // If there is one child, return it directly
                            const firstChild = children.pop()
                            if (firstChild) {
                                return new Proxy(firstChild, {
                                        get: function (target, name) {
                                            return getProperty(target, name.toString())
                                        }
                                    }
                                )
                            }
                        } else if (children.length > 1) {
                            // If there are multiple children (for example, there are blocks with the same label), return
                            // an array of children
                            return children.map(c => new Proxy(c, {
                                    get: function (target, name) {
                                        return getProperty(target, name.toString())
                                    }
                                }
                            ))
                        }
                    }

                    return undefined
                }
            })
        }
    }

    return undefined
}

function getUnquotedPropertyValue(node: AttributeNode | undefined): string | number | boolean | DictionaryNode | undefined {
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
            set: function () {
                // no op - this is a read only object
                return true
            },
            get: function (target, name) {
                return getProperty(target, name.toString())
            }
        })
    }

    return undefined
}

function wrapChildAttributes(target: AST, name: string) {
    const attributes = target
        ?.filter(c =>
            c.type === NodeType.ATTRIBUTE_NODE &&
            c.name.value === name)
        .map(c => getUnquotedPropertyValue(c as AttributeNode))

    if (attributes !== undefined && attributes.length != 0) {
        if (attributes.length === 1) {
            return attributes.pop()
        }
        return attributes
    }

    return undefined
}

/**
 * Takes a value returned from an array, which could have been an indexed lookup of an object, or could have
 * been a request for the array length, and returns the appropriate value.
 * @param item The property from the array
 */
function wrapItem(item: any): any {
    // assume an object being returned was an index lookup
    if (typeof item === 'object') {
        // this has to be proxied
        return new Proxy(item, {
            set: function () {
                // no op - this is a read only object
                return true
            },
            get: function (target, name) {
                return getProperty(target, name.toString())
            }
        })
    }

    // anything else is assumed to be a lookup like "length"
    return item
}

function wrapChildArray(target: AST, name: string) {
    const children = target
        .filter(c => c.type == NodeType.BLOCK_NODE)
        .map(c => c as BlockNode)
        .filter(c => c.name.value === name)

    if (children && children.length != 0) {
        return new Proxy(children, {
            set: function () {
                // no op - this is a read only object
                return true
            },
            get: function (target, name) {
                // return any array based properties as normal
                if (name in target) {
                    return wrapItem(target[name as any]);
                }

                // Otherwise, look up the child based on a label
                const children = target.filter(b => b.labels
                    ?.map(l => JSON.parse(l.value.value))
                    .pop() === name)

                if (children.length === 1) {
                    const child = children.pop()
                    if (child) {
                        return new Proxy(child, {
                            set: function () {
                                // no op - this is a read only object
                                return true
                            },
                            get: function (target, name) {
                                return getProperty(target, name.toString())
                            }
                        })
                    }
                }

                if (children.length > 1) {

                    return children.map(c => new Proxy(c, {
                        set: function () {
                            // no op - this is a read only object
                            return true
                        },
                        get: function (target, name) {
                            return getProperty(target, name.toString())
                        }
                    }))
                }

                return undefined
            }
        })
    }

    return undefined
}