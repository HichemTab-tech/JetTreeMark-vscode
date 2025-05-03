"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  checkAllChildren,
  checkAllFolders,
  uncheckAllChildren,
  checkWithoutChildren,
  checkOnlyFoldersAtLevel,
  checkOnlyFilesAtLevel,
  checkAllChildrenAtLevel
} from "@/lib/tree-utils"

export interface TreeNodeType {
  id: string
  name: string
  type: "file" | "folder"
  checked: boolean
  indeterminate?: boolean
  children?: TreeNodeType[]
}

interface TreeViewProps {
  data: TreeNodeType[]
  onChange: (data: TreeNodeType[]) => void
}

export const TreeView: React.FC<TreeViewProps> = ({ data, onChange }) => {
  const [treeData, setTreeData] = useState<TreeNodeType[]>(data)
  const [allExpanded, setAllExpanded] = useState(true)

  useEffect(() => {
    setTreeData(data)
  }, [data])

  // Deep clone the tree to avoid direct state mutations
  const cloneTree = (nodes: TreeNodeType[]): TreeNodeType[] => {
    return nodes.map((node) => ({
      ...node,
      children: node.children ? cloneTree(node.children) : undefined,
    }))
  }

  // Update a node's checked state and propagate changes
  const updateNodeCheckedState = (nodes: TreeNodeType[], nodeId: string, checked: boolean): TreeNodeType[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        // Update the current node
        const updatedNode = { ...node, checked, indeterminate: false }

        // If it has children, update all children to match
        if (updatedNode.children && updatedNode.children.length > 0) {
          updatedNode.children = updateNodeCheckedState(updatedNode.children, "ALL_CHILDREN", checked)
        }

        return updatedNode
      } else if (nodeId === "ALL_CHILDREN") {
        // Special case for updating all children
        const updatedNode = { ...node, checked, indeterminate: false }

        if (updatedNode.children && updatedNode.children.length > 0) {
          updatedNode.children = updateNodeCheckedState(updatedNode.children, "ALL_CHILDREN", checked)
        }

        return updatedNode
      } else if (node.children && node.children.length > 0) {
        // Recursively update children
        const updatedChildren = updateNodeCheckedState(node.children, nodeId, checked)

        // Check if the node's checked state needs to be updated based on children
        if (JSON.stringify(updatedChildren) !== JSON.stringify(node.children)) {
          // Calculate the new state based on children
          const allChecked = updatedChildren.every((child) => child.checked)
          const noneChecked = updatedChildren.every((child) => !child.checked && !child.indeterminate)

          return {
            ...node,
            children: updatedChildren,
            checked: allChecked,
            indeterminate: !allChecked && !noneChecked,
          }
        }
      }

      return node
    })
  }

  const handleNodeCheck = (nodeId: string, checked: boolean) => {
    // Clone the tree to avoid direct state mutations
    const treeCopy = cloneTree(treeData)

    // Update the node and propagate changes
    const updatedTree = updateNodeCheckedState(treeCopy, nodeId, checked)

    setTreeData(updatedTree)
    onChange(updatedTree)
  }

  // Apply a transformation to a specific node and its children
  const applyTransformation = (nodeId: string, transformation: (nodes: TreeNodeType[]) => TreeNodeType[]) => {
    const treeCopy = cloneTree(treeData)

    // Find and transform the node with the given ID
    const transformNode = (nodes: TreeNodeType[], id: string): TreeNodeType[] => {
      return nodes.map(node => {
        if (node.id === id) {
          // If this is the target node, apply the transformation to its children
          if (node.children && node.children.length > 0) {
            const transformedChildren = transformation(node.children)

            // Calculate the new state based on children
            const allChecked = transformedChildren.every((child) => child.checked)
            const noneChecked = transformedChildren.every((child) => !child.checked && !child.indeterminate)

            return {
              ...node,
              children: transformedChildren,
              checked: allChecked,
              indeterminate: !allChecked && !noneChecked,
            }
          }
          return node
        } else if (node.children && node.children.length > 0) {
          // If not the target node, recursively search its children
          return {
            ...node,
            children: transformNode(node.children, id)
          }
        }
        return node
      })
    }

    const updatedTree = transformNode(treeCopy, nodeId)
    setTreeData(updatedTree)
    onChange(updatedTree)
  }

  // Apply a transformation to a specific node without affecting its children
  const applyNodeTransformation = (nodeId: string, transformation: (node: TreeNodeType) => TreeNodeType) => {
    const treeCopy = cloneTree(treeData)

    // Find and transform the node with the given ID
    const transformNode = (nodes: TreeNodeType[], id: string): TreeNodeType[] => {
      return nodes.map(node => {
        if (node.id === id) {
          // If this is the target node, apply the transformation
          return transformation(node)
        } else if (node.children && node.children.length > 0) {
          // If not the target node, recursively search its children
          return {
            ...node,
            children: transformNode(node.children, id)
          }
        }
        return node
      })
    }

    const updatedTree = transformNode(treeCopy, nodeId)
    setTreeData(updatedTree)
    onChange(updatedTree)
  }

  // Toggle expansion state for all nodes
  const toggleAllExpanded = (expanded: boolean) => {
    setAllExpanded(expanded)
  }

  return (
    <div className="tree-view">
      <div className="flex justify-end mb-2 gap-2">
        <button 
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => toggleAllExpanded(true)}
        >
          Expand All
        </button>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => toggleAllExpanded(false)}
        >
          Collapse All
        </button>
      </div>
      {treeData.map((node) => (
        <TreeNode 
          key={node.id} 
          node={node} 
          level={0} 
          onCheck={handleNodeCheck}
          applyTransformation={applyTransformation}
          applyNodeTransformation={applyNodeTransformation}
          forceExpanded={allExpanded}
        />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: TreeNodeType
  level: number
  onCheck: (nodeId: string, checked: boolean) => void
  applyTransformation: (nodeId: string, transformation: (nodes: TreeNodeType[]) => TreeNodeType[]) => void
  applyNodeTransformation: (nodeId: string, transformation: (node: TreeNodeType) => TreeNodeType) => void
  forceExpanded?: boolean
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  onCheck, 
  applyTransformation,
  applyNodeTransformation,
  forceExpanded 
}) => {
  const [expanded, setExpanded] = useState(true)
  const checkboxRef = useRef<HTMLButtonElement>(null)
  const hasChildren = node.children && node.children.length > 0

  // Set indeterminate property on checkbox (can't be done through React props)
  useEffect(() => {
    if (checkboxRef.current && node.indeterminate) {
      checkboxRef.current.dataset.state = "indeterminate"
    }
  }, [node.indeterminate])

  // Update expanded state when forceExpanded changes
  useEffect(() => {
    if (forceExpanded !== undefined) {
      setExpanded(forceExpanded)
    }
  }, [forceExpanded])

  const handleToggle = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    }
  }

  const handleCheckChange = (checked: boolean) => {
    onCheck(node.id, checked)
  }

  // Context menu handlers
  const handleCheckAllChildren = () => {
    applyTransformation(node.id, checkAllChildren)
  }

  const handleCheckAllFolders = () => {
    applyTransformation(node.id, checkAllFolders)
  }

  const handleUncheckAllChildren = () => {
    applyTransformation(node.id, uncheckAllChildren)
  }

  const handleCheckWithoutChildren = () => {
    applyNodeTransformation(node.id, checkWithoutChildren)
  }

  const handleCheckOnlyFoldersAtLevel = () => {
    applyTransformation(node.id, checkOnlyFoldersAtLevel)
  }

  const handleCheckOnlyFilesAtLevel = () => {
    applyTransformation(node.id, checkOnlyFilesAtLevel)
  }

  const handleCheckAllChildrenAtLevel = () => {
    applyTransformation(node.id, checkAllChildrenAtLevel)
  }

  return (
    <div className="tree-node">
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex items-center py-1 hover:bg-gray-100 rounded px-1">
            <div
              className="flex items-center"
              style={{
                paddingLeft: `${level * 20}px`,
              }}
            >
              {hasChildren ? (
                <button onClick={handleToggle} className="w-5 h-5 flex items-center justify-center mr-1">
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <div className="w-5 h-5 mr-1" />
              )}

              <Checkbox
                ref={checkboxRef}
                checked={node.checked}
                onCheckedChange={handleCheckChange}
                className={cn("data-[state=indeterminate]:bg-gray-400 data-[state=indeterminate]:text-white")}
              />


              <span className="ml-2 mr-1">
                {node.type === "folder" ? (
                    expanded ? (
                        <FolderOpen size={18} className="text-yellow-500" />
                    ) : (
                        <Folder size={18} className="text-yellow-500" />
                    )
                ) : (
                    <File size={18} className="text-gray-500" />
                )}
              </span>

              <span className="ml-1">{node.name}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCheckAllChildren}>Check All Children</ContextMenuItem>
          <ContextMenuItem onClick={handleCheckAllFolders}>Check All Folders</ContextMenuItem>
          <ContextMenuItem onClick={handleUncheckAllChildren}>Uncheck All Children</ContextMenuItem>
          <ContextMenuItem onClick={handleCheckWithoutChildren}>Check Without Children</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
                Level-Specific Operations
            </ContextMenuSubTrigger>
            <ContextMenuSubContent title="Level-Specific Operations">
              <ContextMenuItem onClick={handleCheckOnlyFoldersAtLevel}>Check Only Folders (This Level)</ContextMenuItem>
              <ContextMenuItem onClick={handleCheckOnlyFilesAtLevel}>Check Only Files (This Level)</ContextMenuItem>
              <ContextMenuItem onClick={handleCheckAllChildrenAtLevel}>Check All Children (This Level)</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setExpanded(true)}>Expand</ContextMenuItem>
          <ContextMenuItem onClick={() => setExpanded(false)}>Collapse</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && expanded && (
        <div className="tree-children relative">
          {/* Visual connector line */}
          <div
            className="absolute border-l border-gray-300"
            style={{
              left: `${level * 20 + 10}px`,
              top: 0,
              bottom: 0,
            }}
          />
          {node.children!.map((childNode) => (
            <TreeNode 
              key={childNode.id} 
              node={childNode} 
              level={level + 1} 
              onCheck={onCheck}
              applyTransformation={applyTransformation}
              applyNodeTransformation={applyNodeTransformation}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
