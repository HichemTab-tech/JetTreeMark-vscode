import {TreeNodeType} from "@/components/tree-view"

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

  // Function to check all children of a node
  export function checkAllChildren(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      const newNode = { ...node, checked: true, indeterminate: false }
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = checkAllChildren(newNode.children)
      }
      return newNode
    })
  }

  // Function to check all folders in the tree
  export function checkAllFolders(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      const newNode = { ...node }
      if (node.type === "folder") {
        newNode.checked = true
        newNode.indeterminate = false
      }

      if (newNode.children && newNode.children.length > 0) {
        newNode.children = checkAllFolders(newNode.children)
      }

      return newNode
    })
  }

  // Function to uncheck all children of a node
  export function uncheckAllChildren(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      const newNode = { ...node, checked: false, indeterminate: false }
      if (newNode.children && newNode.children.length > 0) {
        newNode.children = uncheckAllChildren(newNode.children)
      }
      return newNode
    })
  }

  // Function to check a node without affecting its children
  export function checkWithoutChildren(node: TreeNodeType): TreeNodeType {
    return { ...node, checked: true, indeterminate: false }
  }

  // Function to check only folders at a specific level
  export function checkOnlyFoldersAtLevel(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      const newNode = { ...node }
      newNode.checked = node.type === "folder"
      newNode.indeterminate = false

      return newNode
    })
  }

  // Function to check only files at a specific level
  export function checkOnlyFilesAtLevel(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      const newNode = { ...node }
      newNode.checked = node.type === "file"
      newNode.indeterminate = false

      return newNode
    })
  }

  // Function to check all children at a specific level
  export function checkAllChildrenAtLevel(nodes: TreeNodeType[]): TreeNodeType[] {
    return nodes.map((node) => {
      return {...node, checked: true, indeterminate: false}
    })
  }
