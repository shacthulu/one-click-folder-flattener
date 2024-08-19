import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PopoverClose } from '@radix-ui/react-popover';
import { X } from 'lucide-react';

export function TabbedPopoverContent(){
    return (
        <PopoverContent className="w-auto max-w-[400px]">
            <PopoverClose className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </PopoverClose>
            <Tabs defaultValue="classic">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="public">Public Repos</TabsTrigger>
                    <TabsTrigger value="private">Private Repos</TabsTrigger>
                    <TabsTrigger value="classic">Classic</TabsTrigger>
                </TabsList>
                <TabsContent value="public">
                    <ol className="list-decimal mx-3 space-y-1 text-sm">
                        <li>Go to the <a href="https://github.com/settings/tokens?type=beta" className="underline text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer">GitHub Fine-grained token generation page</a></li>
                        <li>Click <Badge variant="outline">Generate New Token</Badge></li>
                        <li>Create a memorable token name</li>
                        <li>Under Repository access, select <Badge variant="outline">🔘Public Repositories (read only)</Badge></li>
                        <li>Click <Badge variant="secondary" className='bg-green-300 '>Generate Token</Badge></li>
                        <li>Copy the token</li>
                        <Alert variant="default" className="mt-1">
                            <AlertDescription>Store the token securely like a password. You won&apos;t be able to see it again.</AlertDescription>
                        </Alert>
                    </ol>
                </TabsContent>
                <TabsContent value="private">
                    <ol className="list-decimal mx-3 space-y-1 text-sm">
                        <li>Go to the <a href="https://github.com/settings/tokens?type=beta" className="underline text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer">GitHub Fine-grained token generation page</a></li>
                        <li>Click <Badge variant="outline" >Generate New Token</Badge></li>
                        <li>Create a memorable token name</li>
                        <li>Under <b>Repository access</b>, select <Badge variant="outline">🔘All Repositories</Badge> or <Badge variant="outline">🔘Only Select Repositories</Badge> based on your needs.</li>
                        <li>Under <b>Permissions</b>, open the <Badge variant="outline">Repository permissions</Badge> dropdown</li>
                        <li>Next to <b>Contents</b> change <Badge variant="outline">Access: No access</Badge> to <Badge variant="outline">Access: Read-only</Badge></li>
                        <Alert variant="destructive" className="my-1">
                            <AlertDescription>Be cautious when granting access to private repositories. Only give the necessary permissions.</AlertDescription>
                        </Alert>
                        <li>Click <Badge variant="secondary" className='bg-green-300 '>Generate Token</Badge></li>
                        <li>Copy the token</li>
                        <Alert variant="default" className="mt-1">
                            <AlertDescription>Store the token securely like a password. You won&apos;t be able to see it again.</AlertDescription>
                        </Alert>
                    </ol>
                </TabsContent>
                <TabsContent value="classic">
                    <ol className="list-decimal mx-3 space-y-1 text-sm">
                        <li>Go to the <a href="https://github.com/settings/tokens" className="underline text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer">GitHub token generation page</a></li>
                        <li>Click <Badge variant="outline">Generate New Token</Badge></li>
                        <li>Select <Badge variant="outline">Generate New Token (classic)</Badge></li>
                        <li>Under <Badge variant="secondary" className="mb-1">⏹️ repo</Badge> only select <Badge variant="secondary">☑️ public_repo</Badge> to minimize token privileges.</li>
                        <Alert variant="destructive" className="mt-1 ">
                            <AlertDescription>Selecting the <Badge variant="secondary">☑️ repo</Badge> option grants the token access to your private repositories. Use a read-only GitHub account if you need this.</AlertDescription>
                        </Alert>
                        <li>Click <Badge variant="outline">Generate Token</Badge></li>
                        <li>Copy the token</li>
                        <Alert variant="default" className="mt-1 ">
                            <AlertDescription>You can never see this again. Store it securely like a password.</AlertDescription>
                        </Alert>
                    </ol>
                </TabsContent>
            </Tabs>
        </PopoverContent>
    );
};

export function GitHubTokenPopover() {
    return (
        <Popover>
            <PopoverTrigger>Open GitHub Token Guide</PopoverTrigger>
            <TabbedPopoverContent />
        </Popover>
    );
}