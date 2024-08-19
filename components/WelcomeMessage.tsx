import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

export default function WelcomeMessage() {
    const [ isExpanded, setIsExpanded ] = useState( true )

    return (
        <div className="mb-6 text-xs text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-0">
                <h3 className="font-semibold">Welcome to the One-Click Folder Flattener for ChatGPT, Claude and anything else. All private, all local. </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={ () => setIsExpanded( !isExpanded ) }
                    className="h-6 px-2 hover:bg-blue-100"
                >
                    { isExpanded ? (
                        <>
                            Hide <ChevronUpIcon className="h-4 w-4 ml-1" />
                        </>
                    ) : (
                        <>
                            Show <ChevronDownIcon className="h-4 w-4 ml-1" />
                        </>
                    ) }
                </Button>
            </div>
            <div className={ `overflow-hidden transition-all duration-300 ease-in-out ${ isExpanded ? 'max-h-96' : 'max-h-0' }` }>
                <p>This tool simplifies the process of gathering files from local directories or GitHub repositories, making it easier to attach them to AI chat projects while preserving file structure context. <b>Everything happens client-side. Nothing is sent to the server.</b> This tool is a simple static site, hosted on Vercel&apos;s CDN, running in an isolated browser session. Safe for use with your employer, personal information, or conspiracy theory. Code available on GitHub for verification. <br />
                Follow these 3 simple steps:</p>
                <ol className="list-decimal list-inside my-2">
                    <li>Choose your files (local or from GitHub)</li>
                    <li>Review and flatten the file structure</li>
                    <li>Download the zipped, flattened files</li>
                </ol>
                <p>Note that browser limitations may currently fail if the GitHub server response fails or is too long, or when creating very large zip files. This won&apos;t affect many users. Exact size limitations vary but are most often seen around 2GB.  If you encounter issues, consider flattening smaller sections.</p>
            </div>
        </div>
    )
}