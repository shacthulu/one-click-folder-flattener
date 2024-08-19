import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DownloadIcon, FolderIcon, Github, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function ScopeRepositoryPopoverContent() {
    return (
        <PopoverContent className="w-auto max-w-80">
            <Card className="border-0 shadow-none">
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                            <DownloadIcon className="h-4 w-4" />
                            Download Entire Repository
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Navigate to the GitHub repository.</li>
                            <li>Use the URL from the address bar as is.</li>
                            <div className="font-mono text-xs bg-muted p-1 rounded">
                                https://github.com/username/repo-name
                            </div>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                            <FolderIcon className="h-4 w-4" />
                            Download Specific Directory
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 ml-4">
                            <li>Navigate to the specific directory.</li>
                            <li>Copy the URL from the address bar. Typical URL structure:</li>

                            <div className="font-mono text-xs bg-muted p-1 rounded">
                                https://github.com/username/repo-name/tree/branch-name/directory-name
                            </div>
                            <Alert variant="default" className="mt-1">
                                <AlertDescription>Directory scope is experimental.</AlertDescription>
                            </Alert>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </PopoverContent>
    );
};

export function ScopeRepositoryPopover() {
    return (
        <Popover>
            <PopoverTrigger>Click here for instructions to add only a single folder of the repository</PopoverTrigger>
            <ScopeRepositoryPopoverContent />
        </Popover>
    );
}