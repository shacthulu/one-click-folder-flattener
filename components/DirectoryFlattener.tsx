import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FolderOpen, Github, Download, Trash2, FileText, Loader2, Key, Heart, XCircle, Paperclip, ListTree, BetweenVerticalStart, Lightbulb, XIcon } from 'lucide-react';
import JSZip from 'jszip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TabbedPopoverContent } from '@/components/TokenInstructionPopover';
import { ScopeRepositoryPopover } from '@/components/ScopeRepositoryPopover';
import WelcomeMessage from '@/components/WelcomeMessage';

interface GitHubFile {
    name: string;
    download_url: string;
}

interface FlattenedFile {
    originalName: string;
    newName: string;
    file: File | GitHubFile;
}
interface RepoContentsInfo {
    fileCount: number;
    totalSize: number;
}

// Example type guard for GitHubFile
function isGitHubFile( file: File | GitHubFile ): file is GitHubFile {
    return ( file as GitHubFile ).download_url !== undefined;
}

const DirectoryFlattener: React.FC = () => {
    const [ selectedFiles, setSelectedFiles ] = useState<( File | GitHubFile )[]>( [] );
    const [ githubUrl, setGithubUrl ] = useState( '' );
    const [ flattened, setFlattened ] = useState<FlattenedFile[]>( [] );
    const [ error, setError ] = useState( '' );
    const [ isLoading, setIsLoading ] = useState( false );
    const fileInputRef = useRef<HTMLInputElement>( null );
    const [ delimiter, setDelimiter ] = useState( '))' );
    const [ showConfirmModal, setShowConfirmModal ] = useState( false );
    const [ repoContentsInfo, setRepoContentsInfo ] = useState<RepoContentsInfo | null>( null );
    const [ storageType, setStorageType ] = useState<'none' | 'session' | 'local'>( 'none' );
    const [ githubToken, setGithubToken ] = useState( '' );
    const [ showTokenInput, setShowTokenInput ] = useState( false );
    const [ isTokenStored, setIsTokenStored ] = useState( false );
    const [ isFetching, setIsFetching ] = useState( false );
    const [ abortController, setAbortController ] = useState<AbortController | null>( null );
    const [ downloadStatus, setDownloadStatus ] = useState<'idle' | 'zipping' | 'preparing' | 'downloading'>( 'idle' );
    const downloadLinkRef = useRef<HTMLAnchorElement>( null );

    useEffect( () => {
        checkStoredToken();
    }, [] );

    const checkStoredToken = () => {
        const localToken = localStorage.getItem( 'githubToken' );
        const sessionToken = sessionStorage.getItem( 'githubToken' );
        setIsTokenStored( !!localToken || !!sessionToken );
    };

    const handleClearAll = () => {
        setSelectedFiles( [] );
        setFlattened( [] );
    };

    const handleTokenSubmit = ( e: React.FormEvent ) => {
        e.preventDefault();
        switch ( storageType ) {
            case 'local':
                localStorage.setItem( 'githubToken', githubToken );
                break;
            case 'session':
                sessionStorage.setItem( 'githubToken', githubToken );
                break;
            case 'none':
            default:
                // Don't store the token
                break;
        }
        checkStoredToken();
    };

    const handleDelimiterChange = ( event: React.ChangeEvent<HTMLInputElement> ) => {
        setDelimiter( event.target.value );
    };

    const handleTokenChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
        setGithubToken( e.target.value );
    };

    const handleStorageTypeChange = ( value: 'none' | 'session' | 'local' ) => {
        setStorageType( value );
    };

    const clearStorage = () => {
        localStorage.removeItem( 'githubToken' );
        sessionStorage.removeItem( 'githubToken' );
        setGithubToken( '' );
        setIsTokenStored( false );
        setStorageType( 'none' );
    };

    useEffect( () => {
        const storedToken = localStorage.getItem( 'githubToken' );
        if ( storedToken ) {
            setGithubToken( storedToken );
        }
    }, [] );

    const handleFileSelect = ( event: React.ChangeEvent<HTMLInputElement> ) => {
        const newFiles = Array.from( event.target.files || [] );
        setSelectedFiles( prevFiles => [ ...prevFiles, ...newFiles ] );
    };

    const handleRemoveFile = ( index: number ) => {
        setSelectedFiles( prevFiles => prevFiles.filter( ( _, i ) => i !== index ) );
    };

    const parseGithubUrl = ( url: string ) => {
        const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\/(.+))?/;
        const match = url.match( regex );
        if ( match ) {
            return {
                owner: match[ 1 ],
                repo: match[ 2 ],
                branch: match[ 3 ] || 'main',
                path: match[ 4 ] || ''
            };
        }
        return null;
    };

    const fetchRepoContentsInfo = async ( owner: string, repo: string, branch: string, path = '', signal: AbortSignal ) => {
        const url = `https://api.github.com/repos/${ owner }/${ repo }/contents/${ path }`;
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if ( githubToken ) {
            headers[ 'Authorization' ] = `token ${ githubToken }`;
        }

        try {
            const response = await fetch( url, { headers, signal } );
            if ( !response.ok ) {
                const errorBody = await response.text();
                throw new Error( `${ response.status } ${ response.statusText }: ${ errorBody }` );
            }
            const data = await response.json();

            let fileCount = 0;
            let totalSize = 0;

            const processContents = async ( contents: any[] ) => {
                for ( const item of contents ) {
                    if ( signal.aborted ) {
                        throw new DOMException( 'Aborted', 'AbortError' );
                    }
                    if ( item.type === 'file' ) {
                        fileCount++;
                        totalSize += item.size;
                    } else if ( item.type === 'dir' ) {
                        const subContents = await fetchRepoContentsInfo( owner, repo, branch, item.path, signal );
                        fileCount += subContents.fileCount;
                        totalSize += subContents.totalSize;
                    }
                }
            };

            await processContents( data );

            return { fileCount, totalSize };
        } catch ( error: any ) {
            if ( error.name === 'AbortError' ) {
                throw error; // Re-throw AbortError to be handled in handleGithubSubmit
            }
            console.error( `Error fetching repo contents info: ${ error }` );
            throw new Error( `Failed to fetch repository contents: ${ error.message }` );
        }
    };

    async function fetchGithubContents( owner: string, repo: string, branch: string, path = '' ) {
        const url = `https://api.github.com/repos/${ owner }/${ repo }/contents/${ path }`;
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
        };
        console.log( `Fetching GitHub contents from URL: ${ url }` );
        if ( githubToken ) {
            headers[ 'Authorization' ] = `token ${ githubToken }`;
            console.log( 'Using GitHub token for authentication' );
        }
        try {
            const response = await fetch( url, { headers } );
            console.log( `Response status: ${ response.status }` );

            if ( !response.ok ) {
                const errorBody = await response.text(); // Assuming the error body is text; adjust if JSON
                console.log( `Error fetching repository contents: ${ errorBody }` );
                throw new Error( 'Failed to fetch repository contents' );
            }

            const data = await response.json();
            return data;
        } catch ( error ) {
            console.error( `Exception when fetching GitHub contents: ${ error }` );
            throw error;
        }
    }

    // Placeholder.  This only works if the fine-grained token has "star a repository permissions"
    // async function handleOneClickGithubStar() {
    //     const url = `https://api.github.com/user/starred/shacthulu/one-click-folder-flattener`;

    //     const headers: HeadersInit = {
    //         'Accept': 'application/vnd.github.v3+json',
    //     };
    //     console.log( `Starring GitHub repository at URL: ${ url }` );

    //     if ( githubToken ) {
    //         headers[ 'Authorization' ] = `token ${ githubToken }`;
    //         console.log( 'Using GitHub token for authentication' );
    //     }

    //     try {
    //         const response = await fetch( url, {
    //             method: 'PUT',
    //             headers,
    //         } );
    //         console.log( `Response status: ${ response.status }` );

    //         if ( response.status === 204 ) {
    //             console.log( 'Repository starred successfully' );
    //             return true;
    //         } else {
    //             const errorBody = await response.text();
    //             console.log( `Error starring repository: ${ errorBody }` );
    //             throw new Error( 'Failed to star the repository. Click here instead! https://github.com/shacthulu/one-click-folder-flattener' );
    //         }
    //     } catch ( error ) {
    //         console.error( `Exception when starring GitHub repository: ${ error }` );
    //         throw error;
    //     }
    // }

    const flattenGithubContents = async ( owner: string, repo: string, branch: string, path = '' ): Promise<GitHubFile[]> => {
        const contents = await fetchGithubContents( owner, repo, branch, path );
        let files: GitHubFile[] = [];

        for ( const item of contents ) {
            if ( item.type === 'file' ) {
                files.push( {
                    name: `${ repo }/${ item.path }`,
                    download_url: item.download_url
                } );
            } else if ( item.type === 'dir' ) {
                const subFiles = await flattenGithubContents( owner, repo, branch, item.path );
                files = [ ...files, ...subFiles ];
            }
        }

        return files;
    };

    const cancelDownload = () => {
        if ( abortController ) {
            abortController.abort();
            setIsFetching( false );
            setIsLoading( false );
            setAbortController( null );
        }
    };

    const handleGithubSubmit = async ( e: React.FormEvent ) => {
        e.preventDefault();
        setError( '' );
        setIsLoading( true );
        setIsFetching( true );
        const controller: AbortController = new AbortController();
        setAbortController( controller );

        try {
            const parsedUrl = parseGithubUrl( githubUrl );
            if ( !parsedUrl ) throw new Error( 'Invalid GitHub URL' );

            const { owner, repo, branch, path } = parsedUrl;
            const info = await fetchRepoContentsInfo( owner, repo, branch, path, controller.signal );
            setRepoContentsInfo( info );
            setShowConfirmModal( true );
        } catch ( err: any ) {
            if ( err.name === 'AbortError' ) {
                setError( 'Repo Download Failed: User Aborted' );
            } else {
                setError( `Repo Download Failed. Response: ${ err instanceof Error ? err.message : 'Unknown error' }` );
            }
        } finally {
            setIsLoading( false );
            setIsFetching( false );
            setAbortController( null );
        }
    };

    const confirmFetchFiles = async () => {
        setShowConfirmModal( false );
        setIsLoading( true );

        try {
            const parsedUrl = parseGithubUrl( githubUrl );
            if ( !parsedUrl ) throw new Error( 'Invalid GitHub URL' );

            const { owner, repo, branch, path } = parsedUrl;
            const files = await flattenGithubContents( owner, repo, branch, path );

            setSelectedFiles( files );
        } catch ( err ) {
            setError( err instanceof Error ? err.message : 'An unknown error occurred' );
        } finally {
            setIsLoading( false );
        }
    };

    const flattenFiles = () => {
        const flattened = selectedFiles.map( file => {
            const fileName = isGitHubFile( file ) ? file.name : file.name;
            const parts = fileName.split( '/' );
            const newName = parts.join( delimiter );
            return { originalName: fileName, newName, file };
        } );
        setFlattened( flattened );
    };

    // Placeholder.  This only works if the fine-grained token has "star a repository permissions"
    // const handleStarButtonClick = async () => {
    //     try {
    //         const success = await handleOneClickGithubStar();
    //         if ( success ) {
    //             alert( 'Thank you for starring our repository!' );
    //         }
    //     } catch ( error ) {
    //         alert( 'There was an issue starring the repository.' );
    //     }
    // };

    const downloadFlattened = async () => {
        setDownloadStatus( 'zipping' );
        setError( '' );
        try {
            const zip = new JSZip();

            for ( const file of flattened ) {
                let content: ArrayBuffer | undefined;
                try {
                    if ( file.file instanceof File ) {
                        content = await file.file.arrayBuffer();
                    } else if ( 'download_url' in file.file ) {
                        const response = await fetch( file.file.download_url );
                        if ( !response.ok ) {
                            throw new Error( `Failed to fetch: ${ response.status } ${ response.statusText }` );
                        }
                        content = await response.arrayBuffer();
                    }
                } catch ( fetchError ) {
                    console.error( "Error fetching file content:", fetchError, "File info:", file );
                    setError( `Failed to fetch file: ${ file.originalName }` );
                    continue; // Skip this file and continue with the next
                }

                if ( content ) {
                    zip.file( file.newName, content );
                }
            }

            setDownloadStatus( 'preparing' );
            const content = await zip.generateAsync( { type: "blob" } );

            // Create object URL immediately
            const url = URL.createObjectURL( content );

            // Set up the download link
            if ( downloadLinkRef.current ) {
                downloadLinkRef.current.href = url;
                downloadLinkRef.current.download = 'flattened_files.zip';

                // Trigger download after a short delay
                setTimeout( () => {
                    setDownloadStatus( 'downloading' );
                    downloadLinkRef.current?.click();

                    // Clean up the object URL after a delay
                    setTimeout( () => {
                        URL.revokeObjectURL( url );
                        setDownloadStatus( 'idle' );
                    }, 1000 );
                }, 100 );
            }
        } catch ( err ) {
            console.error( "Failed to download files:", err );
            setError( 'Failed to create zip file: ' + ( err instanceof Error ? err.message : 'Unknown error' ) );
            setDownloadStatus( 'idle' );
        }
    };

    const handleAddFiles = () => {
        fileInputRef.current?.click();
    };

    // const handleDeleteToken = () => {
    //     // Remove the token from local storage
    //     localStorage.removeItem( 'githubToken' );

    //     // Optional: Update application state or UI
    //     // For example, if you have a state to track if a token is set:
    //     setGithubToken( '' ); // Assuming you have a state named `githubToken`

    //     // Or, if you need to update the UI to reflect this change:
    //     // setShowTokenInput(false); // Hide token input if it's shown
    // };

    const handleAddDirectory = () => {
        const input = document.createElement( 'input' );
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = ( event ) => {
            const target = event.target as HTMLInputElement;
            const newFiles = Array.from( target.files || [] ).map( file => {
                // Use webkitRelativePath to get the path, prepend it to the file name
                // If webkitRelativePath is not available, just use the file name
                // I need to test this more.
                const fileNameWithPath = file.webkitRelativePath ? `${ file.webkitRelativePath }` : file.name;
                // Clone the file object with a new name
                const fileWithNewName = new File( [ file ], fileNameWithPath, {
                    type: file.type,
                    lastModified: file.lastModified,
                } );
                return fileWithNewName;
            } );
            setSelectedFiles( prevFiles => [ ...prevFiles, ...newFiles ] );
        };
        input.click();
    };

    return (
        <div className="min-h-screen to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
            <Card className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 justify-between">
                    <CardTitle className="text-3xl font-bold">One-Click Folder Flattener
                        <span className="text-sm font-normal ml-2">v0.2</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <WelcomeMessage />
                    <main id="main-content">
                        <div className="space-y-8">
                            <div>
                                <section aria-labelledby="choose-files-heading">
                                    <h2 id="choose-files-heading" className="text-2xl font-semibold mb-4">
                                        <div className='flex items-center'>
                                            {/*How the **** can it be this hard to make a circle with centered text in Tailwind?!*/ }
                                            <span className="relative w-10 h-10 rounded-full flex justify-center items-center text-center shadow-xl bg-purple-500 text-white mr-2" >1</span>
                                            Choose Your Files
                                        </div>
                                    </h2>
                                    <div className="bg-slate-50 p-4 rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold mb-3">Add Local Files or Directories</h3>
                                        {/* Absolutely hate this components layout and ergonomics. Need to revisit.*/ }
                                        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                                            <input
                                                ref={ fileInputRef }
                                                type="file"
                                                multiple
                                                onChange={ handleFileSelect }
                                                className="hidden"
                                                aria-label="Select files"
                                            />
                                            <Button onClick={ handleAddDirectory } variant="default" className="w-full sm:w-auto ">
                                                <FolderOpen className="mr-2 h-4 w-4" aria-hidden="true" /> Add Directory
                                            </Button>
                                            <Button onClick={ handleAddFiles } variant="default" className="w-full sm:w-auto transition-colors duration-200">
                                                <FileText className="mr-2 h-4 w-4" aria-hidden="true" /> Add Files
                                            </Button>
                                        </div>
                                        <h2 className="text-xl font-semibold mb-0">Add GitHub Repository</h2>
                                        <p className="text-xs text-blue-600 mt-0 mb-3 hover:text-blue-700">
                                            <ScopeRepositoryPopover />
                                        </p>
                                        <form onSubmit={ handleGithubSubmit } className="flex flex-col sm:flex-row gap-3 items-center mb-4">
                                            <label htmlFor="github-url" className="sr-only">GitHub Repository URL with optional subdirectory</label>
                                            <Input
                                                type="text"
                                                id="github-url"
                                                value={ githubUrl }
                                                onChange={ ( e ) => setGithubUrl( e.target.value ) }
                                                placeholder="Enter GitHub repo URL"
                                                className="flex-grow"
                                                aria-label="GitHub Repository URL"
                                            />
                                            <Button type="submit" className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white transition-colors duration-200" disabled={ isLoading }>
                                                { isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Github className="mr-2 h-4 w-4" aria-hidden="true" /> }
                                                { isLoading ? 'Fetching...' : 'Fetch Files' }
                                            </Button>
                                            { isFetching ? (
                                                <Button type="button" onClick={ cancelDownload } className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white transition-colors duration-200">
                                                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Cancel Download
                                                </Button>
                                            ) : (
                                                <Button type="button" variant="outline" onClick={ () => setShowTokenInput( !showTokenInput ) } className="w-full sm:w-auto transition-colors duration-200 hover:bg-gray-900 hover:text-white">
                                                    <Key className="mr-2 h-4 w-4" aria-hidden="true" /> { showTokenInput ? 'Hide Set Token' : 'Set GitHub Token' }
                                                </Button>
                                            ) }
                                            { isTokenStored && (
                                                <Button onClick={ clearStorage } className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white transition-colors duration-200">
                                                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Clear Stored Token
                                                </Button>
                                            ) }
                                        </form>
                                        { ( !showTokenInput && !githubToken ) ? (
                                            <Alert variant="default" className="bg-white">
                                                <AlertTitle>GitHub API Rate Limit</AlertTitle>
                                                <AlertDescription>
                                                    GitHub API requests are limited to 60 per hour for unauthenticated users. To increase this limit to 5000 requests per hour, click the &quot;Set GitHub Token&quot; button above and follow the instructions. If you see this message, the token isn&apos;t set.
                                                </AlertDescription>
                                            </Alert> )
                                            : null }
                                        { showTokenInput && (
                                            <form onSubmit={ handleTokenSubmit } className="mb-4">
                                                <div className="flex flex-col items-start gap-1 my-2">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <label htmlFor="github-token" className="sr-only">GitHub Personal Access Token</label>
                                                        <Input
                                                            id="github-token"
                                                            type="password"
                                                            value={ githubToken }
                                                            onChange={ handleTokenChange }
                                                            placeholder="Enter your GitHub Personal Access Token"
                                                            className="flex-grow"
                                                            area-describedby="token-instructions"
                                                        />
                                                        <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white transition-colors duration-200">
                                                            Use Token
                                                        </Button>
                                                    </div>
                                                    <Popover >
                                                        <PopoverTrigger className="text-xs transition-colors duration-200 mb-1 text-blue-600 hover:text-blue-700 hover:underline">Click here for an easy 45-second process to get one</PopoverTrigger>
                                                        <TabbedPopoverContent />
                                                    </Popover>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label htmlFor="storage-type" className="text-sm font-medium mr-2">
                                                        Token storage options
                                                    </label>
                                                    <Select onValueChange={ handleStorageTypeChange } value={ storageType }>
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select storage type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Don&apos;t Store</SelectItem>
                                                            <SelectItem value="session">Session Storage</SelectItem>
                                                            <SelectItem value="local">Local Storage</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Alert variant={ storageType === 'none' ? 'default' : 'destructive' } className="mt-2 bg-white">
                                                    <AlertTitle>{ storageType === 'none' ? 'Recommended' : 'Warning' }</AlertTitle>
                                                    <AlertDescription>
                                                        { storageType === 'none'
                                                            ? " This is the most secure option. Instead, we recommend using a password manager to securely store and auto-fill your GitHub token."
                                                            : storageType === 'session'
                                                                ? "Session storage clears when the browser tab is closed, but is still vulnerable to attackers. Only use tokens with minimal permissions, ideally limited to public repositories."
                                                                : "Local storage persists across browser sessions and is vulnerable to attackers. This exists solely for a few edge cases. Only use tokens with minimal permissions, ideally limited to public repositories." }
                                                        { storageType !== 'none' && (
                                                            <><br /><br />For better security, consider using a password manager instead of storing the token in the browser.</>
                                                        ) }
                                                    </AlertDescription>
                                                </Alert>
                                            </form>
                                        ) }
                                    </div>
                                </section>
                            </div>

                            { selectedFiles.length > 0 && (
                                <section aria-labelledby="review-files-heading">
                                    <div>
                                        <h2 id="review-files-heading" className="text-2xl font-semibold mb-4">
                                            <div className='flex items-center'>
                                                <span className="relative w-10 h-10  rounded-full flex justify-center items-center text-center shadow-xl bg-purple-500 text-white mr-2" >2</span>
                                                Review Selected Files
                                            </div>
                                        </h2>

                                        <div className="bg-slate-100 pb-5 pt-3 px-4 rounded-lg shadow-md">
                                            <div className="flex justify-between items-center mb-2 px-4">
                                                <span className="text-sm text-gray-600">{ selectedFiles.length } file(s) selected</span>
                                                <Button
                                                    onClick={ handleClearAll }
                                                    variant="outline"
                                                    className="text-red-600 hover:text-white hover:bg-red-600 transition-colors duration-200"
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                            <ul className="bg-slate-50 rounded-lg m-2 mx-5 py-2 px-4 max-h-60 overflow-y-auto transition-all duration-300 ease-in-out" aria-label="Selected files">
                                                { selectedFiles.map( ( file, index ) => (
                                                    <li
                                                        key={ index }
                                                        className="flex items-center justify-between text-md hover:bg-slate-100 rounded transition-colors duration-200"
                                                    >
                                                        <span className="truncate flex-1">{ isGitHubFile( file ) ? file.name : file.name }</span>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={ () => handleRemoveFile( index ) }
                                                            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-0"
                                                            aria-label={ `Remove ${ isGitHubFile( file ) ? file.name : file.name }` }
                                                        >
                                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </li>
                                                ) ) }
                                            </ul>
                                            <Button
                                                onClick={ flattenFiles }
                                                variant="default"
                                                className="w-full sm:w-auto"
                                            >
                                                <ListTree className="h-4 w-4 mr-2 " aria-hidden="true" /> Flatten Files
                                            </Button> <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="mt-2 w-full ml-0 sm:ml-2 sm:w-auto hover:text-white hover:bg-primary" aria-label="Open delimiter settings">
                                                        <BetweenVerticalStart className="h-4 w-4 mr-2" aria-hidden="true" />
                                                        Change Separator <span className='ml-1 py-0 px-1 bg-secondary border border-gray-500 rounded-sm text-black'>{ delimiter }</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="grid gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none">Separator Settings</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                Set the delimiter used when flattening directories. Slashes recreate the directories. Avoid the characters <code>{ ` : * ? " < > |` }</code>
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <div className="grid grid-cols-3 items-center gap-4">
                                                                <label htmlFor="delimiter">Delimiter</label>
                                                                <Input
                                                                    id="delimiter"
                                                                    value={ delimiter }
                                                                    onChange={ handleDelimiterChange }
                                                                    className="col-span-2 h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </section>
                            ) }
                            { flattened.length > 0 && (
                                <section aria-labelledby="download-files-heading">
                                    <h2 id="download-files-heading" className="text-2xl font-semibold mb-4">
                                        <div className='flex items-center'>
                                            <span className="relative w-10 h-10 rounded-full flex justify-center items-center text-center shadow-xl bg-purple-500 text-white mr-2">3</span>
                                            Download Flattened Files
                                        </div>
                                    </h2>
                                    <div className="bg-slate-100 rounded-lg p-4 transition-all duration-300 ease-in-out shadow-md">
                                        <ul className="pl-5 mb-4 max-h-40 overflow-y-auto bg-slate-50 rounded-lg" aria-label="Flattened files">
                                            { flattened.map( ( file, index ) => (
                                                <li key={ index } className="py-1"><div className="flex items-center"><Paperclip className='h-3 w-3 text-slate-400 mr-1' aria-hidden="true" />{ file.newName }</div></li>
                                            ) ) }
                                        </ul>
                                        <Button
                                            onClick={ downloadFlattened }
                                            variant="default"
                                            className='mt-2 w-full ml-0 sm:ml-2 sm:w-auto'
                                            disabled={ downloadStatus !== 'idle' }
                                        >
                                            { downloadStatus === 'idle' ? (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                                                    Zip and Download Files
                                                </>
                                            ) : (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                                    { downloadStatus === 'zipping' && 'Creating Zip...' }
                                                    { downloadStatus === 'preparing' && 'Preparing Download...' }
                                                    { downloadStatus === 'downloading' && 'Starting Download...' }
                                                </>
                                            ) }
                                        </Button>
                                        <a ref={ downloadLinkRef } style={ { display: 'none' } } />
                                    </div>
                                </section>
                            ) }

                            { error && (
                                <Alert variant="destructive">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{ error }</AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={ () => setError( '' ) }
                                        aria-label="Dismiss alert"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                </Alert>
                            ) }

                            <div className='flex justify-between'> <div className="text-xs text-center text-gray-600">
                                <a
                                    href="https://github.com/shacthulu/one-click-folder-flattener"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
                                >
                                    <Github className="mr-2 h-4 w-4" />
                                    Star this project if you found it useful!
                                </a>
                            </div>
                                <p className="inline-flex items-center text-center text-xs text-gray-500">
                                    <Heart className="mx-1 h-3 w-3 text-red-500" aria-hidden="true" fill="red" /> @ShaCthulu
                                </p>
                            </div>
                        </div>
                        {/* Placeholder. This only works if the fine-grained token has "star a repository permissions"
                        { githubToken && <div className='flex justify-center items-center mt-2'><Button variant="outline" className="text-xs" onClick={ handleStarButtonClick }><Star className="mr-2 h-4 w-4" /> Expiremental One-click Github Star! (requires token being set)</Button></div> } */}
                    </main>
                </CardContent>
            </Card>
            <Dialog open={ showConfirmModal } onOpenChange={ setShowConfirmModal }>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Repository Fetch</DialogTitle>
                        <DialogDescription>
                            { repoContentsInfo && (
                                <>
                                    <p>This repository contains:</p>
                                    <ul className="list-disc list-inside indent-4 mb-1">
                                        <li className=""><b>Number of files:</b> { repoContentsInfo.fileCount }</li>
                                        <li><b>Total size:</b> { ( repoContentsInfo.totalSize / 1024 / 1024 ).toFixed( 2 ) } MB</li>
                                    </ul>
                                    <p>Are you sure you want to add these files? </p>
                                    <Alert variant="default" className="mt-2 text-green-700 bg-white">
                                        <Lightbulb strokeWidth={ 1 } className="mr-2" color='green' />
                                        <AlertDescription>You may scope the number of files by entering the URL to a subdirectory such as https://github.com/author/repo/folder. Note that your browser may fail when zipping a large amount of files, typically around 2GB for most browsers.</AlertDescription>
                                    </Alert>
                                </>
                            ) }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={ () => setShowConfirmModal( false ) } variant="outline" className="text-red-600 hover:text-white hover:bg-red-600">Cancel</Button>
                        <Button onClick={ confirmFetchFiles } variant="default" >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* <div className="mt-8 text-center text-gray-600">
                <a
                    href="https://github.com/shacthulu/one-click-folder-flattener"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
                >
                    <Github className="mr-2 h-5 w-5" />
                    Star this project if you found it useful!
                </a>
            </div> */}
        </div>
    );
};

export default DirectoryFlattener;