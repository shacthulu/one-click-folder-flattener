import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ErrorDisplayProps {
    error: string;
}

export function ErrorDisplay( { error }: ErrorDisplayProps ) {
    let parsedError: any;

    try {
        parsedError = JSON.parse( error );
    } catch ( e ) {
        // If parsing fails, use the original error message
        parsedError = { message: error };
    }

    const renderErrorContent = ( obj: any, depth = 0 ) => {
        return Object.entries( obj ).map( ( [ key, value ] ) => (
            <div key={ key } style={ { marginLeft: `${ depth * 20 }px` } }>
                <span className="font-semibold">{ key }: </span>
                { typeof value === 'object' && value !== null ? (
                    <div>{ renderErrorContent( value, depth + 1 ) }</div>
                ) : (
                    <span>{ String( value ) }</span>
                ) }
            </div>
        ) );
    };

    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    { renderErrorContent( parsedError ) }
                </ScrollArea>
            </AlertDescription>
        </Alert>
    );
}