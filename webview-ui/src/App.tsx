"use client";

import {useState, useEffect, useCallback, useRef} from "react";
import {TreeNodeType, TreeView} from "@/components/tree-view";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {X, Coffee, Github, Code} from "lucide-react";
import {cn} from "@/lib/utils";
import Logo from "./components/logo";
import {SampleTree} from "@/lib/sample-tree.ts";

// Tab definition
interface Tab {
    id: string;
    title: string;
    data: TreeNodeType[];
    isWelcome?: boolean;
}

const isDev = import.meta.env.VITE_APP_ENV === 'development'

export default function TreeViewPage() {
    const [isSuccess, setIsSuccess] = useState(false);
    const renderedOnce = useRef(false);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                setIsSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

    // start with only the welcome tab
    const [tabs, setTabs] = useState<Tab[]>([
        {id: "welcome", title: "Welcome", data: [], isWelcome: true},
    ]);
    const [activeTab, setActiveTab] = useState("welcome");

    // add a new tab (replaces old addNewTab / addSampleTab)
    const addSampleTab = useCallback((title: string, initialData: TreeNodeType[]) => {
        const newId = `tab-${Date.now()}`;
        setTabs((prev) => [
            ...prev,
            {id: newId, title, data: initialData},
        ]);
        setActiveTab(newId);
        return newId;
    }, []);

    // close logic
    const closeTab = useCallback(
        (id: string) => {
            setTabs((prev) => {
                const filtered = prev.filter((t) => t.id !== id);
                if (activeTab === id && filtered.length > 0) {
                    setActiveTab(filtered[filtered.length - 1].id);
                }
                return filtered;
            });
        },
        [activeTab]
    );

    // update the tree data for a specific tab
    const updateTabData = useCallback((id: string, newData: TreeNodeType[]) => {
        setTabs((prev) =>
            prev.map((t) => (t.id === id ? {...t, data: newData} : t))
        );
    }, []);

    // copy logic (unchanged)
    const filterUncheckedNodes = (nodes: TreeNodeType[]): TreeNodeType[] =>
        nodes
            .filter((n) => n.checked || n.indeterminate)
            .map((n) => {
                const c = {...n};
                if (c.children) c.children = filterUncheckedNodes(c.children);
                delete c.indeterminate;
                return c;
            });

    const formatTreeAsText = (
        nodes: TreeNodeType[],
        prefix = ""
    ): string => {
        let out = "";
        nodes.forEach((n, i) => {
            const last = i === nodes.length - 1;
            const conn = last ? "└──" : "├──";
            out += `${prefix}${conn} ${n.name}\n`;
            if (n.children && n.children.length) {
                const childPref = prefix + (last ? "    " : "│   ");
                out += formatTreeAsText(n.children, childPref);
            }
        });
        return out;
    };

    const handleCopyToClipboard = (data: TreeNodeType[]) => {
        const txt = formatTreeAsText(filterUncheckedNodes(data));
        console.log("Copying to clipboard:", txt);
        navigator.clipboard.writeText(txt).catch(console.error);
        setIsSuccess(true);
    };

    // **NEW**: listen for messages from the extension
    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            const msg = e.data;
            console.log("Received message from extension:", msg);
            if (msg.command === "addFolder") {
                // derive a tab title from the folder path
                const parts = msg.folderPath.replace(/[/\\]$/, "").split(/[/\\]/);
                const title = parts[parts.length - 1] || msg.folderPath;
                addSampleTab(title, msg.tree as TreeNodeType[]);
            }
        };
        window.addEventListener("message", onMessage);

        return () => window.removeEventListener("message", onMessage);
    }, [addSampleTab]);

    useEffect(() => {
        if (isDev && !renderedOnce.current) {
            renderedOnce.current = true;
            setTimeout(function () {
                window.postMessage(SampleTree);
            }, 1000);
        }
    }, []);

    return (
        <div className="mx-auto p-6 bg-white">
            <div className="flex flex-col gap-6">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <div className="flex items-center border-b">
                        <TabsList className="h-10 bg-transparent p-0">
                            {tabs.map((tab) => (
                                <div key={tab.id} className="flex items-center">
                                    <TabsTrigger
                                        value={tab.id}
                                        className={cn(
                                            "flex justify-between data-[state=active]:bg-background " +
                                            "data-[state=active]:shadow-none rounded-none border-b-2 " +
                                            "border-b-transparent data-[state=active]:border-b-primary " +
                                            "py-2 transition-all duration-200",
                                            {"px-0 pl-4": !tab.isWelcome},
                                            {"px-4": tab.isWelcome}
                                        )}
                                    >
                                        {tab.title}
                                        {!tab.isWelcome && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 ml-1 rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    closeTab(tab.id);
                                                }}
                                            >
                                                <X className="h-3 w-3"/>
                                                <span className="sr-only">Close tab</span>
                                            </Button>
                                        )}
                                    </TabsTrigger>
                                </div>
                            ))}
                        </TabsList>
                    </div>

                    {tabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-4">
                            {tab.isWelcome ? (
                                <WelcomeTab/>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={() => handleCopyToClipboard(tab.data)}
                                        >
                                            {isSuccess ? "Copied!" : "Copy to Clipboard"}
                                        </Button>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-white">
                                        <TreeView
                                            data={tab.data}
                                            onChange={(d) => updateTabData(tab.id, d)}
                                        />
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}

// Welcome tab remains unchanged
function WelcomeTab() {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-6 w-32 h-32 rounded-full flex items-center justify-center">
                <Logo/>
            </div>

            <h2 className="text-3xl font-bold mb-2">Welcome to JetTreeMark</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                Instantly generate and copy a beautiful tree view of your project's folders inside VS Code.
            </p>

            <div className="flex flex-col gap-4 items-center">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg max-w-lg">
                    <p className="text-amber-800 font-medium">
                        <span className="font-bold">Tip:</span> To use this tool, right-click on a folder in your file
                        explorer and
                        click "Show Tree View" from the context menu.
                    </p>
                </div>

                <div className="flex gap-4 mt-6 justify-around w-full max-w-md">
                    <a
                        href="https://github.com/HichemTab-tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-muted-foreground hover:text-blue-700 transition-colors"
                    >
                        <Github size={20} className="group-hover:animate-wiggle transition-transform"/>
                        <span>GitHub</span>
                    </a>

                    <a
                        href="https://github.com/HichemTab-tech/JetTreeMark-vscode"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors"
                    >
                        <Code size={20} className="group-hover:animate-spin transition-transform"/>
                        <span>Contribute</span>
                    </a>

                    <a
                        href="https://buymeacoffee.com/hichemtabtech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-muted-foreground hover:text-amber-600 transition-colors"
                    >
                        <Coffee size={20} className="group-hover:animate-bounce transition-transform"/>
                        <span>Buy me a coffee</span>
                    </a>
                </div>
            </div>
        </div>
    )
}