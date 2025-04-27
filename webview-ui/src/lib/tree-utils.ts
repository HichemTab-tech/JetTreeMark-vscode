import { TreeNodeType } from "@/components/tree-view"

// Function to add checked property to all nodes in the tree
export function processTreeData(data: TreeNodeType[]) {
    return data.map((node) => {
      const newNode = { ...node, checked: true }
      if (node.children && node.children.length > 0) {
        newNode.children = processTreeData(node.children)
      }
      return newNode
    })
  }
  
  // Function to create a new tree with a unique ID
  export function createNewTree(name: string, data: TreeNodeType[]) {
    return {
      id: `tree-${Date.now()}`,
      name,
      data: processTreeData(data),
    }
  }
  
  // Function to filter out unchecked nodes
  export function filterUncheckedNodes(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes
      .filter((node) => node.checked)
      .map((node) => {
        const newNode = { ...node }
        if (newNode.children) {
          newNode.children = filterUncheckedNodes(newNode.children)
        }
        delete newNode.indeterminate
        return newNode
      })
  }
  
  // Function to format tree as text
  export function formatTreeAsText(nodes: TreeNodeType[], prefix = "", isRoot = true): string {
    let result = isRoot ? "File Structure:\n\n" : ""
  
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1
      const connector = isLast ? "└──" : "├──"
      const nodeType = node.type === "folder" ? "📁" : "📄"
  
      result += `${prefix}${connector} ${nodeType} ${node.name}\n`
  
      if (node.children && node.children.length > 0) {
        const childPrefix = prefix + (isLast ? "    " : "│   ")
        result += formatTreeAsText(node.children, childPrefix, false)
      }
    })
  
    return result
  }  