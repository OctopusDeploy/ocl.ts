import {Lexer} from "./lexer";
import {Parser} from "./parser";
import type {ArrayNode, AST, ASTNode, AttributeNode, BlockNode, DictionaryNode, LiteralNode} from "./ast";
import {LiteralType, NodeType} from "./ast";
import type {Token} from "./token";

/**
 * Return a proxied "root node" that allows the AST to be traversed with simple dot notation. The proxy
 * also returns the correct metadata to allow it to be serialized to JSON.
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
            ownKeys: ownKeys,
            getOwnPropertyDescriptor: getOwnPropertyDescriptor,
            set: set
        }
    )
}

/**
 * Get a property from a AST node. Properties map to the children of block or dictionary nodes.
 * @param node The node to return the child from
 * @param name The name of the child/property
 */
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
                set: set,
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
                                        },
                                        ownKeys: ownKeys,
                                        getOwnPropertyDescriptor: getOwnPropertyDescriptor
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

/**
 * Return a plain JavaScript value for attribute nodes. HereDocs are returned in their unprocessed form.
 * @param node The node to return the value of.
 */
function getUnquotedPropertyValue(node: AttributeNode | undefined): string | number | boolean | DictionaryNode | undefined {
    if (!node || node.type !== NodeType.ATTRIBUTE_NODE) {
        return undefined
    }

    if (node.value.type == NodeType.LITERAL_NODE) {
        const attValueNode = node.value as LiteralNode
        const litValueNode = attValueNode.value as Token
        const value = litValueNode.value

        if (attValueNode.literalType != LiteralType.INDENTED_HEREDOC && attValueNode.literalType != LiteralType.HEREDOC) {
            return JSON.parse(value)
        }

        return value
    }

    if (node.value.type === NodeType.DICTIONARY_NODE) {
        return new Proxy(node.value, {
            set: set,
            get: function (target, name) {
                return getProperty(target, name.toString())
            },
            ownKeys: ownKeys,
            getOwnPropertyDescriptor: getOwnPropertyDescriptor
        })
    }

    return undefined
}

/**
 * getOwnPropertyDescriptor is required to allow an object to be serialized to JSON. AST nodes with children expose
 * the child values, otherwise hide all other properties.
 */
function getOwnPropertyDescriptor(target: any, prop: string | symbol) {
    if (['AttributeNode', 'BlockNode', 'DictionaryNode'].includes(target.type)) {

        if (['BlockNode'].includes(target.type)) {
            if (prop === "__labels") {
                return {
                    configurable: true,
                    enumerable: true,
                    value: (target as BlockNode).labels
                }
            }
        }

        const value = getProperty((target as AttributeNode | BlockNode | DictionaryNode), prop.toString())
        return {
            configurable: true,
            enumerable: true,
            value: value
        }
    }

    return {configurable: false, enumerable: false, value: undefined};
}

/**
 * ownKeys is required to allow an object to be serialized to JSON. Any AST node with children exposes the
 * children as properties. BlockNodes also expose labels with "__labels". Other properties are hidden.
 */
function ownKeys(target: any) {
    if (['AttributeNode', 'BlockNode', 'DictionaryNode'].includes(target.type)) {
        const keys = (target as AttributeNode | BlockNode).children
            .filter(c => ['AttributeNode', 'BlockNode'].includes(c.type))
            .map(c => (c as AttributeNode | BlockNode).name.value)
            .filter((value, index, self) => self.indexOf(value) === index)

        if ('BlockNode' == target.type) {
            keys.push("__labels")
        }

        return keys
    }

    if (['EOFNode', 'LiteralNode', 'RecoveryNode'].includes(target.type)) {
        return []
    }

    if (['ArrayNode'].includes(target.type)) {
        return Reflect.ownKeys((target as ArrayNode).children)
    }

    return Reflect.ownKeys(target)
}

/**
 * Return a single value where appropriate, an array of values where the property lookup had duplicate values, or
 * undefined if there is no attribute node with the supplied name.
 * @param target The target node
 * @param name The name of the property
 */
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
            set: set,
            get: function (target, name) {
                return getProperty(target, name.toString())
            },
            ownKeys: ownKeys,
            getOwnPropertyDescriptor: getOwnPropertyDescriptor
        })
    }

    // anything else is assumed to be a lookup like "length"
    return item
}

/**
 * A no-op set trap because the proxies are read only objects
 */
function set() {
    return true
}

/**
 * Return a collection of block nodes that are themselves proxied to return a single block matching the label
 * or a collection if there are multiple blocks with the same label. Return undefined if no blocks match the name,
 * @param target The target node
 * @param name The name of the child block to return
 */
function wrapChildArray(target: AST, name: string) {
    const children: BlockNode[] = target
        .filter(c => c.type == NodeType.BLOCK_NODE)
        .map(c => c as BlockNode)
        .filter(c => c.name.value === name)

    if (children && children.length != 0) {
        return new Proxy(children, {
            set: set,
            get: function (target: BlockNode[], name) {
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
                            set: set,
                            get: function (target, name) {
                                return getProperty(target, name.toString())
                            }
                        })
                    }
                }

                if (children.length > 1) {

                    return children.map(c => new Proxy(c, {
                        set: set,
                        get: function (target, name) {
                            return getProperty(target, name.toString())
                        }
                    }))
                }

                return undefined
            },
            ownKeys: ownKeys,
            getOwnPropertyDescriptor: getOwnPropertyDescriptor
        })
    }

    return undefined
}